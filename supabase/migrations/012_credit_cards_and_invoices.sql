-- Modulo de cartoes e faturas (arquitetura separada de contas)

CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  bank_name TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  limit_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  closing_day INT NOT NULL,
  due_day INT NOT NULL,
  payment_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  is_automatic BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT credit_cards_closing_day_check CHECK (closing_day BETWEEN 1 AND 31),
  CONSTRAINT credit_cards_due_day_check CHECK (due_day BETWEEN 1 AND 31)
);

-- Garante colunas quando a tabela ja existe (CREATE TABLE IF NOT EXISTS nao altera estrutura)
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#6366f1';
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS limit_total DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS closing_day INT;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS due_day INT;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS payment_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS is_automatic BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE credit_cards DROP CONSTRAINT IF EXISTS credit_cards_closing_day_check;
ALTER TABLE credit_cards ADD CONSTRAINT credit_cards_closing_day_check CHECK (closing_day BETWEEN 1 AND 31);
ALTER TABLE credit_cards DROP CONSTRAINT IF EXISTS credit_cards_due_day_check;
ALTER TABLE credit_cards ADD CONSTRAINT credit_cards_due_day_check CHECK (due_day BETWEEN 1 AND 31);

CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_payment_account_id ON credit_cards(payment_account_id);

CREATE TABLE IF NOT EXISTS credit_card_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  reference_month DATE NOT NULL,
  closing_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT credit_card_invoices_status_check CHECK (status IN ('open', 'closed', 'paid', 'partial', 'late'))
);

ALTER TABLE credit_card_invoices ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE credit_card_invoices ADD COLUMN IF NOT EXISTS credit_card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE;
ALTER TABLE credit_card_invoices ADD COLUMN IF NOT EXISTS reference_month DATE;
ALTER TABLE credit_card_invoices ADD COLUMN IF NOT EXISTS closing_date DATE;
ALTER TABLE credit_card_invoices ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE credit_card_invoices ADD COLUMN IF NOT EXISTS amount_total DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE credit_card_invoices ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE credit_card_invoices ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE credit_card_invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE credit_card_invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE credit_card_invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE credit_card_invoices DROP CONSTRAINT IF EXISTS credit_card_invoices_status_check;
ALTER TABLE credit_card_invoices ADD CONSTRAINT credit_card_invoices_status_check CHECK (status IN ('open', 'closed', 'paid', 'partial', 'late'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_card_invoices_unique_cycle
  ON credit_card_invoices(credit_card_id, reference_month);
CREATE INDEX IF NOT EXISTS idx_credit_card_invoices_user_id ON credit_card_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_invoices_status ON credit_card_invoices(status);

CREATE TABLE IF NOT EXISTS credit_card_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES credit_card_invoices(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  purchase_date DATE NOT NULL,
  installment_number INT NOT NULL DEFAULT 1,
  installment_total INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT credit_card_invoice_items_amount_check CHECK (amount > 0),
  CONSTRAINT credit_card_invoice_items_installment_number_check CHECK (installment_number >= 1),
  CONSTRAINT credit_card_invoice_items_installment_total_check CHECK (installment_total >= 1),
  CONSTRAINT credit_card_invoice_items_status_check CHECK (status IN ('active', 'cancelled', 'ignored'))
);

ALTER TABLE credit_card_invoice_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE credit_card_invoice_items ADD COLUMN IF NOT EXISTS credit_card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE;
ALTER TABLE credit_card_invoice_items ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES credit_card_invoices(id) ON DELETE CASCADE;
ALTER TABLE credit_card_invoice_items ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;
ALTER TABLE credit_card_invoice_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE credit_card_invoice_items ADD COLUMN IF NOT EXISTS amount DECIMAL(14,2);
ALTER TABLE credit_card_invoice_items ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE credit_card_invoice_items ADD COLUMN IF NOT EXISTS installment_number INT NOT NULL DEFAULT 1;
ALTER TABLE credit_card_invoice_items ADD COLUMN IF NOT EXISTS installment_total INT NOT NULL DEFAULT 1;
ALTER TABLE credit_card_invoice_items ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE credit_card_invoice_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE credit_card_invoice_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE credit_card_invoice_items DROP CONSTRAINT IF EXISTS credit_card_invoice_items_amount_check;
ALTER TABLE credit_card_invoice_items ADD CONSTRAINT credit_card_invoice_items_amount_check CHECK (amount > 0);
ALTER TABLE credit_card_invoice_items DROP CONSTRAINT IF EXISTS credit_card_invoice_items_installment_number_check;
ALTER TABLE credit_card_invoice_items ADD CONSTRAINT credit_card_invoice_items_installment_number_check CHECK (installment_number >= 1);
ALTER TABLE credit_card_invoice_items DROP CONSTRAINT IF EXISTS credit_card_invoice_items_installment_total_check;
ALTER TABLE credit_card_invoice_items ADD CONSTRAINT credit_card_invoice_items_installment_total_check CHECK (installment_total >= 1);
ALTER TABLE credit_card_invoice_items DROP CONSTRAINT IF EXISTS credit_card_invoice_items_status_check;
ALTER TABLE credit_card_invoice_items ADD CONSTRAINT credit_card_invoice_items_status_check CHECK (status IN ('active', 'cancelled', 'ignored'));

CREATE INDEX IF NOT EXISTS idx_credit_card_invoice_items_invoice_id ON credit_card_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_invoice_items_card_id ON credit_card_invoice_items(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_invoice_items_transaction_id ON credit_card_invoice_items(transaction_id);

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS credit_card_invoice_id UUID REFERENCES credit_card_invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invoice_item_id UUID REFERENCES credit_card_invoice_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_credit_card_id ON transactions(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_credit_card_invoice_id ON transactions(credit_card_invoice_id);

ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_own_credit_cards ON credit_cards;
CREATE POLICY users_own_credit_cards ON credit_cards
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS users_own_credit_card_invoices ON credit_card_invoices;
CREATE POLICY users_own_credit_card_invoices ON credit_card_invoices
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS users_own_credit_card_invoice_items ON credit_card_invoice_items;
CREATE POLICY users_own_credit_card_invoice_items ON credit_card_invoice_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
