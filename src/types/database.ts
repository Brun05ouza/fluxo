export type TransactionType = 'expense' | 'income';
export type TransactionKind = 'income' | 'expense' | 'transfer' | 'invoice_payment' | 'adjustment';
export type TransactionOrigin = 'manual' | 'automatic' | 'imported' | 'recurring';
export type SettlementStatus = 'pending' | 'settled' | 'ignored';

/** Período da recorrência (detalhes no formulário expandido) */
export type RecurringInterval = 'MONTH' | 'WEEK';

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

/** Tipo de conta (referência Mobills) */
export type AccountType =
  | 'CHECKING'
  | 'CASH'
  | 'SAVINGS'
  | 'INVESTMENT'
  | 'MEAL_VOUCHER'
  | 'OTHER'
  | 'CREDIT_CARD';

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'CHECKING', label: 'Conta corrente' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'CREDIT_CARD', label: 'Cartão de crédito' },
  { value: 'SAVINGS', label: 'Poupança' },
  { value: 'INVESTMENT', label: 'Investimentos' },
  { value: 'MEAL_VOUCHER', label: 'VR / VA' },
  { value: 'OTHER', label: 'Outros' },
];

export interface Account {
  id: string;
  user_id: string;
  name: string;
  institution_key: string;
  account_type: AccountType;
  color: string;
  initial_balance: number;
  credit_limit: number | null;
  include_in_home_total: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  bank_name: string | null;
  color: string;
  limit_total: number;
  closing_day: number;
  due_day: number;
  payment_account_id: string | null;
  is_automatic: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CreditCardInvoiceStatus = 'open' | 'closed' | 'paid' | 'partial' | 'late';

export interface CreditCardInvoice {
  id: string;
  user_id: string;
  credit_card_id: string;
  reference_month: string;
  closing_date: string;
  due_date: string;
  amount_total: number;
  amount_paid: number;
  status: CreditCardInvoiceStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditCardInvoiceItem {
  id: string;
  user_id: string;
  credit_card_id: string;
  invoice_id: string;
  transaction_id: string | null;
  description: string;
  amount: number;
  purchase_date: string;
  installment_number: number;
  installment_total: number;
  status: 'active' | 'cancelled' | 'ignored';
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  planning_item_id?: string | null;
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  amount: number;
  /**
   * Data de competencia (referencia contabil/analitica).
   * Mantida opcional para compatibilidade durante migracao de schema.
   */
  competency_date?: string | null;
  /**
   * Data efetiva de caixa.
   * Mantida opcional para compatibilidade durante migracao de schema.
   */
  effective_date?: string | null;
  date: string;
  transaction_kind?: TransactionKind;
  origin?: TransactionOrigin;
  settlement_status?: SettlementStatus;
  payment_method: string;
  account_id?: string | null;
  credit_card_id?: string | null;
  credit_card_invoice_id?: string | null;
  invoice_item_id?: string | null;
  destination_account_id?: string | null;
  tags: string[];
  is_recurring: boolean;
  spending_type?: SpendingType | null;
  /** false = não paga (despesa) ou não recebida (receita) */
  is_paid?: boolean;
  is_ignored?: boolean;
  recurring_count?: number | null;
  recurring_interval?: RecurringInterval | null;
  attachment_url?: string | null;
  created_at: string;
}

/** Payload do formulário: envia também opção de criar conta fixa (não é coluna SQL) */
export type TransactionSavePayload = Omit<Transaction, 'id' | 'user_id' | 'created_at'> & {
  create_fixed_expense?: boolean;
  attachmentFile?: File | null;
};

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

/** Snapshot opcional gravado no wizard de primeiro acesso */
export interface OnboardingData {
  extraIncomes?: Array<{ label: string; amount: number }>;
}

export interface FinancialProfile {
  id: string;
  monthly_income: number;
  pay_day: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  /** Null/undefined = wizard de primeiro acesso pendente */
  onboarding_completed_at?: string | null;
  onboarding_data?: OnboardingData | null;
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
