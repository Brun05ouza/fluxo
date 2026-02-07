-- Perfil financeiro do usuário (renda, dia de recebimento)
CREATE TABLE IF NOT EXISTS financial_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_income DECIMAL(12, 2) DEFAULT 0,
  pay_day INT DEFAULT 1 CHECK (pay_day >= 1 AND pay_day <= 31),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Obrigações mensais (contas fixas)
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  due_day INT NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user_id ON fixed_expenses(user_id);

ALTER TABLE financial_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_financial_profile" ON financial_profile
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "users_own_fixed_expenses" ON fixed_expenses
  FOR ALL USING (auth.uid() = user_id);
