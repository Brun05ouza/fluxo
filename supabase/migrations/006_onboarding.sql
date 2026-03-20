-- Onboarding de primeiro acesso: flag e snapshot opcional
ALTER TABLE financial_profile
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB;

COMMENT ON COLUMN financial_profile.onboarding_completed_at IS 'Quando o usuário concluiu o wizard de primeiro acesso; NULL = não concluído ou legado sem flag';
COMMENT ON COLUMN financial_profile.onboarding_data IS 'Snapshot opcional (ex.: rendas extras) preenchido no onboarding';

-- Usuários que já tinham perfil antes desta feature: não exibir onboarding
UPDATE financial_profile
SET onboarding_completed_at = COALESCE(onboarding_completed_at, updated_at, created_at, now())
WHERE onboarding_completed_at IS NULL;
