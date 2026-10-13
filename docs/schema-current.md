> Documento histórico adaptado para Neon. Para configuração vigente, consulte README.md e neon/migrations; números de migrations e instruções de buckets anteriores são históricos.

# Schema atual — Fluxo

> Documentação do estado atual do banco de dados Neon.
> **Não alterar este documento** ao aplicar migrations — ele reflete o schema antes das alterações incrementais.

---

## 1. Tabelas existentes

| Tabela             | Migração | Descrição                               |
|--------------------|----------|-----------------------------------------|
| `transactions`     | 001      | Transações financeiras (receitas/despesas) |
| `budgets`          | 001      | Orçamentos por categoria                |
| `users`            | 002      | Perfil do usuário (espelho neon_auth.user)  |
| `financial_profile`| 003      | Renda mensal, dia de recebimento        |
| `fixed_expenses`   | 003      | Contas fixas (obrigações mensais)       |

---

## 2. Transações (`transactions`)

| Coluna          | Tipo         | Nullable | Default      |
|-----------------|--------------|----------|--------------|
| id              | UUID         | NO       | gen_random_uuid() |
| user_id         | UUID         | NO       | —            |
| title           | TEXT         | NO       | —            |
| description     | TEXT         | YES      | —            |
| category        | TEXT         | NO       | —            |
| amount          | DECIMAL(12,2)| NO       | —            |
| date            | DATE         | NO       | —            |
| payment_method  | TEXT         | NO       | —            |
| tags            | TEXT[]       | YES      | '{}'         |
| is_recurring    | BOOLEAN      | YES      | false        |
| created_at      | TIMESTAMPTZ  | YES      | now()        |

**FK:** `user_id` → `neon_auth.user(id)` ON DELETE CASCADE

**Índices:** `idx_transactions_user_id`, `idx_transactions_date`

**RLS:** `users_own_transactions` — `auth.uid() = user_id`

**Convenção:** `amount` > 0 = receita, `amount` < 0 = despesa

---

## 3. Categorias

**Não existe tabela de categorias.** Categorias são constantes no frontend:

```
Alimentação, Transporte, Casa, Lazer, Saúde, Educação, Assinaturas, Trabalho, Extra, Outros
```

A coluna `category` em `transactions`, `budgets` e `fixed_expenses` armazena esses valores como TEXT.

---

## 4. Usuários (`users`)

| Coluna    | Tipo        | Nullable | Default   |
|-----------|-------------|----------|-----------|
| id        | UUID        | NO       | —         |
| nome      | TEXT        | NO       | —         |
| cpf       | TEXT        | NO       | —         |
| email     | TEXT        | NO       | —         |
| created_at| TIMESTAMPTZ | YES      | now()     |
| updated_at| TIMESTAMPTZ | YES      | now()     |

**PK/FK:** `id` → `neon_auth.user(id)` ON DELETE CASCADE
**UNIQUE:** `email`

**Índices:** `idx_users_email`, `idx_users_cpf`

**RLS:** `users_own_profile` — `auth.uid() = id`

**Sincronização:** Trigger em `neon_auth.user` (insert/update) → `sync_neon_user()`

---

## 5. Orçamentos (`budgets`)

| Coluna       | Tipo         | Nullable | Default      |
|--------------|--------------|----------|--------------|
| id           | UUID         | NO       | gen_random_uuid() |
| user_id      | UUID         | NO       | —            |
| category     | TEXT         | NO       | —            |
| limit_amount | DECIMAL(12,2)| NO       | —            |
| created_at   | TIMESTAMPTZ  | YES      | now()        |

**UNIQUE:** `(user_id, category)`

**FK:** `user_id` → `neon_auth.user(id)` ON DELETE CASCADE

**Índices:** `idx_budgets_user_id`

**RLS:** `users_own_budgets` — `auth.uid() = user_id`

---

## 6. Perfil financeiro (`financial_profile`)

| Coluna        | Tipo         | Nullable | Default |
|---------------|--------------|----------|---------|
| id            | UUID         | NO       | —       |
| monthly_income| DECIMAL(12,2)| YES      | 0       |
| pay_day       | INT          | YES      | 1       |
| created_at    | TIMESTAMPTZ  | YES      | now()   |
| updated_at    | TIMESTAMPTZ  | YES      | now()   |

**PK/FK:** `id` → `neon_auth.user(id)` ON DELETE CASCADE
**CHECK:** `pay_day BETWEEN 1 AND 31`

**RLS:** `users_own_financial_profile` — `auth.uid() = id`

---

## 7. Contas fixas (`fixed_expenses`)

| Coluna    | Tipo         | Nullable | Default      |
|-----------|--------------|----------|--------------|
| id        | UUID         | NO       | gen_random_uuid() |
| user_id   | UUID         | NO       | —            |
| title     | TEXT         | NO       | —            |
| amount    | DECIMAL(12,2)| NO       | —            |
| due_day   | INT          | NO       | —            |
| category  | TEXT         | NO       | —            |
| is_active | BOOLEAN      | YES      | true         |
| created_at| TIMESTAMPTZ  | YES      | now()        |

**FK:** `user_id` → `neon_auth.user(id)` ON DELETE CASCADE
**CHECK:** `due_day BETWEEN 1 AND 31`

**Índices:** `idx_fixed_expenses_user_id`

**RLS:** `users_own_fixed_expenses` — `auth.uid() = user_id`

---

## Resumo

| Entidade    | Tabela             | Tipo                    |
|-------------|--------------------|-------------------------|
| Transações  | `transactions`     | Tabela                  |
| Categorias  | —                  | Constante (frontend)    |
| Usuários    | `users`            | Tabela (+ neon_auth.user)   |
| Orçamentos  | `budgets`          | Tabela                  |
| Perfil      | `financial_profile`| Tabela                  |
| Contas fixas| `fixed_expenses`   | Tabela                  |
