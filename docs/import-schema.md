> Documento histórico adaptado para Neon. Para configuração vigente, consulte README.md e neon/migrations; números de migrations e instruções de buckets anteriores são históricos.

# Schema para Importação de Extrato

> Auditoria FASE 0 — Mapeamento do schema e fluxo de transações para a feature de importação.

---

## 1. Tabela de transações (`transactions`)

| Coluna         | Tipo          | Nullable | Descrição                          |
|----------------|---------------|----------|------------------------------------|
| id             | UUID          | NO       | PK, gen_random_uuid()              |
| user_id        | UUID          | NO       | FK neon_auth.user                      |
| title          | TEXT          | NO       | Descrição principal                |
| description    | TEXT          | YES      | Observação opcional                |
| category       | TEXT          | NO       | Valor de CATEGORIES (constante)    |
| amount         | DECIMAL(12,2) | NO       | Positivo=receita, Negativo=despesa |
| date           | DATE          | NO       | Formato YYYY-MM-DD                 |
| payment_method | TEXT          | NO       | Valor de PAYMENT_METHODS           |
| tags           | TEXT[]        | YES      | Default '{}'                       |
| is_recurring   | BOOLEAN       | YES      | Default false                      |
| spending_type  | TEXT          | YES      | 'ESSENTIAL' \| 'OPTIONAL' \| 'EMOTIONAL' \| NULL |
| created_at     | TIMESTAMPTZ   | YES      | now()                              |

**Convenção:** `amount > 0` = receita, `amount < 0` = despesa

---

## 2. Categorias (não existe tabela)

Categorias são **constantes no frontend** (`src/types/database.ts`):

```ts
CATEGORIES = [
  'Alimentação', 'Transporte', 'Casa', 'Lazer', 'Saúde',
  'Educação', 'Assinaturas', 'Trabalho', 'Extra', 'Outros'
]
```

- Não há `category_id` — usa-se `category` (TEXT)
- Para importação: mapear descrição → categoria sugerida (string)

---

## 3. Serviço / Hook de criação de transações

**Arquivo:** `src/hooks/useTransactions.ts`

**Função principal:** `addTransaction(tx)`

**Assinatura:**
```ts
addTransaction(tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>)
  => Promise<{ error: Error | null }>
```

**Implementação:**
- `neon.from('transactions').insert({ ...tx, user_id: userId })`
- user_id vem do hook (auth)
- Não existe `addTransactions` em lote — importação precisará:
  - Opção A: loop com addTransaction (N inserts)
  - Opção B: `neon.from('transactions').insert([...])` em lote (1 insert)

---

## 4. Forma de pagamento padrão para importação

`PAYMENT_METHODS`: Cartão de Crédito, Cartão de Débito, Pix, Dinheiro, Boleto, Transferência, Débito Automático

Para importação: usar **"Transferência"** ou **"Débito Automático"** como padrão quando o extrato não informar.

---

## 5. Campos obrigatórios para insert

| Campo           | Obrigatório | Valor padrão sugerido (importação) |
|-----------------|-------------|-------------------------------------|
| title           | SIM         | descrição normalizada do extrato    |
| description     | NÃO         | null ou ''                          |
| category        | SIM         | sugerida ou 'Outros'                |
| amount          | SIM         | number (negativo para despesa)      |
| date            | SIM         | YYYY-MM-DD                          |
| payment_method  | SIM         | 'Transferência' ou 'Débito Automático' |
| tags            | NÃO         | []                                  |
| is_recurring    | NÃO         | false                               |
| spending_type   | NÃO         | null                                |

---

## 6. Navegação atual

- App usa **estado `activeTab`** (string), não React Router
- Tabs: dashboard, transactions, fixed-expenses, budgets, reports, settings
- Para importação: adicionar tab `import` e rota correspondente

---

## 7. Resumo para pipeline de importação

1. **Normalizar** raw rows → `{ title, amount, date }` mínimo
2. **Enriquecer** → category (sugerida), payment_method (padrão)
3. **Mapear para insert** → `Omit<Transaction, 'id'|'user_id'|'created_at'>`
4. **Commit** → usar `addTransaction` em loop ou `neon.insert([...])` em lote
