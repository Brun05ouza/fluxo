export type TransactionType = 'expense' | 'income';

/** Mindful Finance: tipo de gasto (despesas) */
export type SpendingType = 'ESSENTIAL' | 'OPTIONAL' | 'EMOTIONAL';

export const SPENDING_TYPES = [
  { value: 'ESSENTIAL' as const, label: 'Essencial', description: 'Necessário para viver' },
  { value: 'OPTIONAL' as const, label: 'Opcional', description: 'Conforto, mas não urgente' },
  { value: 'EMOTIONAL' as const, label: 'Emocional', description: 'Compra por impulso' },
] as const;

export interface UserProfile {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  amount: number;
  date: string;
  payment_method: string;
  tags: string[];
  is_recurring: boolean;
  spending_type?: SpendingType | null;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  created_at: string;
}

export const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Casa',
  'Lazer',
  'Saúde',
  'Educação',
  'Assinaturas',
  'Trabalho',
  'Extra',
  'Outros',
] as const;

export const PAYMENT_METHODS = [
  'Cartão de Crédito',
  'Cartão de Débito',
  'Pix',
  'Dinheiro',
  'Boleto',
  'Transferência',
  'Débito Automático',
] as const;

export interface FinancialProfile {
  id: string;
  monthly_income: number;
  pay_day: number;
  created_at: string;
  updated_at: string;
}

export interface FixedExpense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  due_day: number;
  category: string;
  is_active: boolean;
  created_at: string;
}
