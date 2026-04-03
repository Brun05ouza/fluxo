-- Competência / efetiva, tipo de lançamento, origem, quitação e transferências
-- (alinha o schema ao payload de toTransactionInsertRow no app)

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS competency_date DATE,
  ADD COLUMN IF NOT EXISTS effective_date DATE,
  ADD COLUMN IF NOT EXISTS transaction_kind TEXT,
  ADD COLUMN IF NOT EXISTS origin TEXT,
  ADD COLUMN IF NOT EXISTS settlement_status TEXT,
  ADD COLUMN IF NOT EXISTS destination_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- Preenchimento para linhas existentes
UPDATE transactions
SET transaction_kind = CASE WHEN amount >= 0 THEN 'income' ELSE 'expense' END
WHERE transaction_kind IS NULL;

UPDATE transactions
SET origin = 'manual'
WHERE origin IS NULL;

UPDATE transactions
SET settlement_status = CASE
  WHEN COALESCE(is_ignored, false) THEN 'ignored'
  WHEN is_paid IS FALSE THEN 'pending'
  ELSE 'settled'
END
WHERE settlement_status IS NULL;

ALTER TABLE transactions
  ALTER COLUMN transaction_kind SET DEFAULT 'expense',
  ALTER COLUMN transaction_kind SET NOT NULL;

ALTER TABLE transactions
  ALTER COLUMN origin SET DEFAULT 'manual',
  ALTER COLUMN origin SET NOT NULL;

ALTER TABLE transactions
  ALTER COLUMN settlement_status SET DEFAULT 'settled',
  ALTER COLUMN settlement_status SET NOT NULL;

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_transaction_kind_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_transaction_kind_check
  CHECK (transaction_kind IN ('income', 'expense', 'transfer', 'invoice_payment', 'adjustment'));

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_origin_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_origin_check
  CHECK (origin IN ('manual', 'automatic', 'imported', 'recurring'));

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_settlement_status_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_settlement_status_check
  CHECK (settlement_status IN ('pending', 'settled', 'ignored'));

CREATE INDEX IF NOT EXISTS idx_transactions_destination_account_id ON transactions(destination_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_competency_date ON transactions(competency_date);

COMMENT ON COLUMN transactions.competency_date IS 'Data de competência (referência analítica/contábil)';
COMMENT ON COLUMN transactions.effective_date IS 'Data efetiva de caixa';
COMMENT ON COLUMN transactions.transaction_kind IS 'income | expense | transfer | invoice_payment | adjustment';
COMMENT ON COLUMN transactions.origin IS 'manual | automatic | imported | recurring';
COMMENT ON COLUMN transactions.settlement_status IS 'pending | settled | ignored';
COMMENT ON COLUMN transactions.destination_account_id IS 'Conta destino em transferências';
