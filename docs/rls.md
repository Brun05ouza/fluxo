> Documento histórico adaptado para Neon. Para configuração vigente, consulte README.md e neon/migrations; números de migrations e instruções de buckets anteriores são históricos.

# Row Level Security (RLS) — Fluxo

## Políticas Ativas

Todas as tabelas possuem RLS habilitado. O usuário autenticado (`auth.uid()`) só acessa seus próprios dados.

| Tabela             | Política                  | Regra                               |
|--------------------|---------------------------|-------------------------------------|
| transactions       | users_own_transactions    | `auth.uid() = user_id`              |
| budgets            | users_own_budgets         | `auth.uid() = user_id`              |
| users              | users_own_profile         | `auth.uid() = id`                   |
| financial_profile  | users_own_financial_profile | `auth.uid() = id`                 |
| fixed_expenses     | users_own_fixed_expenses  | `auth.uid() = user_id`              |

## Índices

- `idx_transactions_user_id`, `idx_transactions_date`
- `idx_budgets_user_id`
- `idx_users_email`, `idx_users_cpf`
- `idx_fixed_expenses_user_id`

## Uso

As políticas `FOR ALL` cobrem SELECT, INSERT, UPDATE e DELETE. Não há políticas separadas por operação.
