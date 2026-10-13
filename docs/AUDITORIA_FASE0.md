> Documento histórico adaptado para Neon. Para configuração vigente, consulte README.md e neon/migrations; números de migrations e instruções de buckets anteriores são históricos.

# FASE 0 — Auditoria Fluxo

## 1. Rotas/Telas Existentes

| Rota (tab)       | Componente          | Descrição                                  |
|------------------|---------------------|--------------------------------------------|
| `dashboard`      | Dashboard           | Visão geral: saldo, gráficos, últimas tx   |
| `transactions`   | Transactions        | Lista e gestão de transações               |
| `fixed-expenses` | FixedExpenses       | Contas fixas (obrigações mensais)          |
| `budgets`        | Budgets (Pages)     | Orçamentos por categoria                   |
| `reports`        | Reports (Pages)     | Placeholder "Em breve"                     |
| `settings`       | Settings (Pages)    | Perfil, renda, dia recebimento             |

**Navegação:** Baseada em `activeTab` (estado em App) + Layout com sidebar. Sem React Router.

---

## 2. Modelo de Dados Atual

### Tabelas Neon

| Tabela             | Campos principais                                      |
|--------------------|--------------------------------------------------------|
| `transactions`     | id, user_id, title, description, category, amount, date, payment_method, tags, is_recurring |
| `budgets`          | id, user_id, category, limit_amount                    |
| `users`            | id, nome, cpf, email (espelho neon_auth.user)              |
| `financial_profile`| id, monthly_income, pay_day                            |
| `fixed_expenses`   | id, user_id, title, amount, due_day, category, is_active |

**Convenção:** `amount` em transactions: positivo = receita, negativo = despesa.

---

## 3. Componentes Principais

- **Layout:** AppLayout (sidebar, header, children)
- **Dashboard:** StatCards, gráficos (AreaChart, PieChart), cards de transações/orçamentos/vencimentos
- **TransactionDrawer:** Formulário de nova transação (sem react-hook-form, estado local)
- **Transactions:** Lista de transações
- **FixedExpenses:** CRUD de obrigações
- **Budgets/Settings/Reports:** Em Pages.tsx
- **UI:** shadcn/ui via ui.tsx (Button, Input, Card, ProgressBar, Badge, etc.)

---

## 4. Pontos de Melhoria

| Área        | Situação atual                                      | Melhoria sugerida                         |
|-------------|-----------------------------------------------------|-------------------------------------------|
| **Tipagem** | `StatCard` com `any`; alguns selects sem tipos      | Tipar props, usar `CATEGORIES[number]`    |
| **Forms**   | TransactionDrawer usa estado local                  | react-hook-form + Zod                     |
| **Data**    | Hooks com useState + useEffect + polling 2s         | TanStack Query (cache, invalidation)      |
| **Validação** | validation.ts só CPF/senha/nome                  | Zod para schemas de transação/orçamento   |
| **Duplicação** | formatCurrency repetido em vários arquivos       | Função em lib/utils                       |
| **Reports** | Placeholder vazio                                   | Fase futura                               |
| **Testes**  | Inexistente                                         | Vitest para forecast, transaction-utils   |

---

## 5. Plano de Execução por Fases

### MVP+
- **FASE 1:** Forecast + Alertas (previsão, risco por categoria, toast ao salvar)
- **FASE 2:** Insights rule-based + estrutura para IA
- **FASE 3:** Gamificação (streaks, badges)
- **FASE 4:** Spaces (contas compartilhadas)
- **FASE 5:** Stripe + planos Free/Pro

### Ordem de refatoração paralela (opcional)
- Introduzir TanStack Query aos poucos (começar por useTransactions)
- Adicionar Zod + react-hook-form no TransactionDrawer
- Extrair formatCurrency para lib/utils
