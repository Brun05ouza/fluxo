import type { Account } from '@/types/database';

export type AccountInsertInput = Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function toAccountInsertRow(userId: string, row: AccountInsertInput) {
  return {
    user_id: userId,
    name: String(row.name).slice(0, 200),
    institution_key: String(row.institution_key).slice(0, 64),
    account_type: row.account_type,
    color: String(row.color).slice(0, 32),
    initial_balance: Number(row.initial_balance ?? 0),
    credit_limit: row.credit_limit != null ? Number(row.credit_limit) : null,
    include_in_home_total: Boolean(row.include_in_home_total),
  };
}

export function toAccountUpdatePatch(patch: Partial<AccountInsertInput>) {
  const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) body[key] = value;
  }
  return body;
}
