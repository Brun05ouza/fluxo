-- Campos adicionais para fluxo estilo Mobills (pago/não pago, ignorar, recorrência detalhada)

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_ignored BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurring_count INTEGER,
  ADD COLUMN IF NOT EXISTS recurring_interval TEXT;

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_recurring_interval_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_recurring_interval_check
  CHECK (recurring_interval IS NULL OR recurring_interval IN ('MONTH', 'WEEK'));

COMMENT ON COLUMN transactions.is_paid IS 'false = despesa não paga ou receita ainda não recebida';
COMMENT ON COLUMN transactions.is_ignored IS 'quando true, o lançamento pode ser excluído de totais (uso futuro)';
COMMENT ON COLUMN transactions.recurring_count IS 'número de repetições quando is_recurring e preenchido';
COMMENT ON COLUMN transactions.recurring_interval IS 'MONTH ou WEEK';
