-- FASE 1 — Mindful Finance: tipo de gasto (ESSENTIAL, OPTIONAL, EMOTIONAL)
-- Alteração incremental: coluna nullable, default NULL (não quebra dados existentes)

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS spending_type TEXT
CHECK (spending_type IS NULL OR spending_type IN ('ESSENTIAL', 'OPTIONAL', 'EMOTIONAL'));

-- Índice para relatórios por spending_type
CREATE INDEX IF NOT EXISTS idx_transactions_spending_type ON transactions(spending_type)
WHERE spending_type IS NOT NULL;
