-- Garante todas as colunas esperadas pelo app em `accounts`.
-- Use quando a tabela já existia sem algumas colunas (CREATE TABLE IF NOT EXISTS não altera tabelas antigas).

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS institution_key TEXT NOT NULL DEFAULT 'custom';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'CHECKING';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#6366f1';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(14, 2);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS include_in_home_total BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- CHECK atualizado (inclui CREDIT_CARD); idempotente
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_account_type_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_account_type_check CHECK (
  account_type IN (
    'CHECKING',
    'CASH',
    'SAVINGS',
    'INVESTMENT',
    'MEAL_VOUCHER',
    'OTHER',
    'CREDIT_CARD'
  )
);

COMMENT ON COLUMN accounts.account_type IS 'CHECKING, CASH, CREDIT_CARD, etc.';
