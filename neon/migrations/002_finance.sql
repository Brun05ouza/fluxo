
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category)
);


CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);










CREATE TABLE IF NOT EXISTS financial_profile (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  monthly_income DECIMAL(12, 2) DEFAULT 0,
  pay_day INT DEFAULT 1 CHECK (pay_day >= 1 AND pay_day <= 31),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE IF NOT EXISTS fixed_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  due_day INT NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user_id ON fixed_expenses(user_id);









ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS spending_type TEXT
CHECK (spending_type IS NULL OR spending_type IN ('ESSENTIAL', 'OPTIONAL', 'EMOTIONAL'));


CREATE INDEX IF NOT EXISTS idx_transactions_spending_type ON transactions(spending_type)
WHERE spending_type IS NOT NULL;

ALTER TABLE financial_profile
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB;

COMMENT ON COLUMN financial_profile.onboarding_completed_at IS 'Quando o usuário concluiu o wizard de primeiro acesso; NULL = não concluído ou legado sem flag';
COMMENT ON COLUMN financial_profile.onboarding_data IS 'Snapshot opcional (ex.: rendas extras) preenchido no onboarding';


UPDATE financial_profile
SET onboarding_completed_at = COALESCE(onboarding_completed_at, updated_at, created_at, now())
WHERE onboarding_completed_at IS NULL;


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


CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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


ALTER TABLE accounts ADD COLUMN IF NOT EXISTS institution_key TEXT NOT NULL DEFAULT 'custom';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'CHECKING';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#6366f1';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(14, 2);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS include_in_home_total BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();


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


CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

ALTER TABLE credit_card_invoices ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
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
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

ALTER TABLE credit_card_invoice_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
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















ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS competency_date DATE,
  ADD COLUMN IF NOT EXISTS effective_date DATE,
  ADD COLUMN IF NOT EXISTS transaction_kind TEXT,
  ADD COLUMN IF NOT EXISTS origin TEXT,
  ADD COLUMN IF NOT EXISTS settlement_status TEXT,
  ADD COLUMN IF NOT EXISTS destination_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;


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

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS attachment_url TEXT;
