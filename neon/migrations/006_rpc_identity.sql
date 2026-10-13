-- RPCs may run before the extension's JWT context has been initialized.
-- request.jwt.claims is populated by the Data API from its validated JWT.
CREATE FUNCTION public.session_user_id() RETURNS UUID LANGUAGE sql STABLE SET search_path='' AS $$
  SELECT COALESCE(auth.user_id(), NULLIF(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid
$$;
REVOKE ALL ON FUNCTION public.session_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.session_user_id() TO authenticated;
DO $$ DECLARE f RECORD; BEGIN
  FOR f IN SELECT pg_get_functiondef(p.oid) definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('prepare_financial_month','link_planned_transaction','restore_financial_data','admin_get_users','admin_set_user_admin') LOOP
    EXECUTE replace(f.definition,'auth.user_id()','public.session_user_id()::text');
  END LOOP;
END $$;
