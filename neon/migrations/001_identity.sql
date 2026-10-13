CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  cpf TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sign_in TIMESTAMPTZ
);

CREATE FUNCTION public.sync_neon_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.users (id, nome, email, created_at, updated_at)
  VALUES (NEW.id, NEW.name, NEW.email, NEW."createdAt", NEW."updatedAt")
  ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email, updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_neon_user() FROM PUBLIC;
CREATE TRIGGER sync_neon_user AFTER INSERT OR UPDATE OF name, email ON neon_auth."user"
FOR EACH ROW EXECUTE FUNCTION public.sync_neon_user();

INSERT INTO public.users (id, nome, email, created_at, updated_at)
SELECT id, name, email, "createdAt", "updatedAt" FROM neon_auth."user";
