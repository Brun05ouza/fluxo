-- Contas (carteiras / bancos) — visual, sem integração Open Finance

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  institution_key TEXT NOT NULL DEFAULT 'custom',
  account_type TEXT NOT NULL DEFAULT 'CHECKING',
  color TEXT NOT NULL DEFAULT '#6366f1',
  initial_balance DECIMAL(14, 2) NOT NULL DEFAULT 0,
  credit_limit DECIMAL(14, 2),
  include_in_home_total BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT accounts_account_type_check CHECK (
    account_type IN ('CHECKING', 'CASH', 'SAVINGS', 'INVESTMENT', 'MEAL_VOUCHER', 'OTHER')
  )
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);

COMMENT ON TABLE accounts IS 'Contas do usuário para classificar lançamentos (sem sync bancário)';
COMMENT ON COLUMN transactions.account_id IS 'Conta associada ao lançamento; payment_method mantém rótulo legível';

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Idempotente: permite rodar de novo no SQL Editor sem erro 42710
DROP POLICY IF EXISTS "users_own_accounts" ON accounts;

CREATE POLICY "users_own_accounts" ON accounts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
