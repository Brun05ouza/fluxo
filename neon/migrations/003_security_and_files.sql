ALTER TABLE public.financial_profile ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('avatar', 'attachment')),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 255),
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg','image/png','image/gif','image/webp','application/pdf','text/plain','text/csv')),
  content_base64 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (octet_length(decode(content_base64, 'base64')) BETWEEN 1 AND 5242880),
  CHECK (kind <> 'avatar' OR (content_type LIKE 'image/%' AND octet_length(decode(content_base64, 'base64')) <= 1048576))
);
CREATE INDEX files_user_id ON public.files(user_id);

-- The Data API uses authenticated; anonymous callers receive no privileges.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anonymous, authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['transactions','budgets','fixed_expenses','accounts','credit_cards','credit_card_invoices','credit_card_invoice_items','files'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY owner_access ON public.%I FOR ALL TO authenticated USING (user_id::text = auth.user_id()) WITH CHECK (user_id::text = auth.user_id())', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END;
$$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_access ON public.users TO authenticated USING (id::text = auth.user_id()) WITH CHECK (id::text = auth.user_id());
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE (nome, cpf, avatar_url, updated_at) ON public.users TO authenticated;

ALTER TABLE public.financial_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_access ON public.financial_profile TO authenticated USING (id::text = auth.user_id()) WITH CHECK (id::text = auth.user_id());
GRANT SELECT, DELETE ON public.financial_profile TO authenticated;
-- is_admin is deliberately excluded. A browser must never promote itself.
GRANT INSERT (id, monthly_income, pay_day, onboarding_completed_at, onboarding_data, updated_at),
      UPDATE (monthly_income, pay_day, onboarding_completed_at, onboarding_data, updated_at)
ON public.financial_profile TO authenticated;

-- Foreign keys must also belong to the caller (RLS alone does not check FK ownership).
CREATE FUNCTION public.check_owned_references() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE field TEXT; target TEXT; value UUID; owner UUID;
BEGIN
  FOR field, target IN SELECT * FROM (VALUES
    ('account_id','accounts'), ('destination_account_id','accounts'), ('payment_account_id','accounts'),
    ('credit_card_id','credit_cards'), ('credit_card_invoice_id','credit_card_invoices'),
    ('invoice_id','credit_card_invoices'), ('invoice_item_id','credit_card_invoice_items'),
    ('transaction_id','transactions')
  ) AS refs(field, target) LOOP
    value := (to_jsonb(NEW)->>field)::uuid;
    IF value IS NOT NULL THEN
      EXECUTE format('SELECT user_id FROM public.%I WHERE id = $1', target) INTO owner USING value;
      IF owner IS DISTINCT FROM NEW.user_id THEN RAISE EXCEPTION 'Referência não pertence ao usuário' USING ERRCODE = '42501'; END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.check_owned_references() FROM PUBLIC;
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['transactions','credit_cards','credit_card_invoices','credit_card_invoice_items'] LOOP
    EXECUTE format('CREATE TRIGGER check_owned_references BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.check_owned_references()', t);
  END LOOP;
END $$;

CREATE FUNCTION public.admin_get_users()
RETURNS TABLE(id UUID,email TEXT,full_name TEXT,avatar_url TEXT,is_admin BOOLEAN,monthly_income NUMERIC,onboarding_completed_at TIMESTAMPTZ,created_at TIMESTAMPTZ,tx_count BIGINT,budgets_count BIGINT,last_sign_in TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.financial_profile f WHERE f.id::text = auth.user_id() AND f.is_admin) THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT u.id,u.email,u.nome,u.avatar_url,COALESCE(f.is_admin,false),f.monthly_income,f.onboarding_completed_at,u.created_at,
    (SELECT count(*) FROM public.transactions t WHERE t.user_id = u.id),
    (SELECT count(*) FROM public.budgets b WHERE b.user_id = u.id),u.last_sign_in
    FROM public.users u LEFT JOIN public.financial_profile f ON f.id = u.id ORDER BY u.created_at DESC;
END $$;
CREATE FUNCTION public.admin_set_user_admin(target_id UUID, admin_status BOOLEAN) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.financial_profile f WHERE f.id::text = auth.user_id() AND f.is_admin) THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;
  IF target_id::text = auth.user_id() AND NOT admin_status THEN RAISE EXCEPTION 'Você não pode remover seu próprio acesso admin'; END IF;
  INSERT INTO public.financial_profile(id,is_admin) VALUES(target_id,admin_status)
  ON CONFLICT(id) DO UPDATE SET is_admin = EXCLUDED.is_admin;
END $$;

CREATE FUNCTION public.restore_financial_data() RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE uid UUID := auth.user_id()::uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Não autenticado' USING ERRCODE = '42501'; END IF;
  DELETE FROM public.transactions WHERE user_id = uid;
  DELETE FROM public.credit_card_invoice_items WHERE user_id = uid;
  DELETE FROM public.credit_card_invoices WHERE user_id = uid;
  DELETE FROM public.credit_cards WHERE user_id = uid;
  DELETE FROM public.budgets WHERE user_id = uid;
  DELETE FROM public.fixed_expenses WHERE user_id = uid;
  DELETE FROM public.accounts WHERE user_id = uid;
  DELETE FROM public.files WHERE user_id = uid AND kind = 'attachment';
  UPDATE public.financial_profile SET monthly_income = 0, pay_day = 1, onboarding_completed_at = NULL, onboarding_data = NULL, updated_at = now() WHERE id = uid;
END $$;

REVOKE ALL ON FUNCTION public.admin_get_users(), public.admin_set_user_admin(UUID,BOOLEAN), public.restore_financial_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_users(), public.admin_set_user_admin(UUID,BOOLEAN), public.restore_financial_data() TO authenticated;
