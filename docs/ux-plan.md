# UX Plan — Fluxo SaaS

Documento de auditoria e decisões para elevar o Fluxo a produto SaaS vendável (referência funcional: Mobills; diferenciais: Flux.ia, hábitos, score, mindful finance).

---

## Fase 0 — Auditoria (estado atual)

### 1. Rotas e telas existentes

| Rota | Tela | Observação |
|------|------|------------|
| `/` | Dashboard | Visão do mês, KPIs, score, missões, últimas transações, gastos por categoria |
| `/transactions` | Transações | Lista de lançamentos, filtros, busca |
| `/import` | Importar extrato | Dropzone CSV/OFX, ajuda por banco |
| `/import/preview` | Preview importação | Tabela de revisão, resumo, CTA "Importar extrato" |
| `/fixed-expenses` | Contas fixas | Lista de obrigações mensais, adicionar/remover |
| `/budgets` | Orçamentos | Orçamento por categoria, forecast, barras de progresso |
| `/reports` | Relatórios | Comparação mensal, categorias mais caras, comportamento (Essencial/Opcional/Emocional) |
| `/profile` | Meu Perfil | Nome, foto, email, CPF |
| `/settings` | Configurações | Perfil, aparência, situação financeira, preferências, segurança, restaurar conta |

**Regra:** não quebrar rotas existentes.

---

### 2. Layout

- **Sidebar** ([src/app/components/Layout.tsx](src/app/components/Layout.tsx)):
  - `menuItems`: Dashboard, Transações, Importar, Contas fixas, Orçamentos, Relatórios, Configurações.
  - `SidebarItem`: ícone + label, estado ativo, colapsável (desktop).
  - Rodapé: tema (Modo Claro/Escuro), Sair.
  - Mobile: overlay com mesmo menu.

- **Topbar (header)**:
  - Esquerda: menu hamburger (mobile), título da página.
  - Direita: botão "Nova Transação", sino (notificações), avatar com dropdown (Meu Perfil, Precisa de Ajuda?, Sair).

- **Área de conteúdo:** scrollável, `max-w-7xl mx-auto`, padding responsivo.

---

### 3. Componentes atuais

**UI base** ([src/app/components/ui.tsx](src/app/components/ui.tsx)):
- `Card`, `Button`, `Input`, `Badge`, `ProgressBar`, `Skeleton`, `cn()`.
- Não existem: PageHeader, EmptyState, SectionCard, KPIGroup, PrimaryCTA, InlineHint, SuccessBanner.

**Componentes de página:**
- Dashboard, Transactions, TransactionDrawer, FixedExpenses, Pages (Budgets, Reports, Profile, Settings), ImportPage, ImportPreviewPage, Login, FluxoBrand, ThemeProvider.

**Empty states (textos inline):**
- Dashboard: "Nenhum gasto neste mês", "Nenhuma transação neste mês".
- Transactions: "Nenhum lançamento encontrado. Ajuste os filtros ou adicione uma nova transação."
- Budgets: "Nenhum orçamento configurado. Clique em 'Novo Orçamento' para começar."
- Reports: card com ícone Brain e texto quando sem dados Mindful.
- FixedExpenses: "Nenhuma obrigação cadastrada. Adicione suas contas fixas."
- Import: "Nenhuma transação encontrada." / "Nenhum dado para revisar." (preview).

---

### 4. Hooks e serviços

| Hook | Arquivo | Uso |
|------|---------|-----|
| useTransactions | [src/hooks/useTransactions.ts](src/hooks/useTransactions.ts) | Lista, add, update, delete, addTransactions, fetchByDateRange |
| useBudgets | [src/hooks/useBudgets.ts](src/hooks/useBudgets.ts) | Lista, add, delete |
| useForecast | [src/hooks/useForecast.ts](src/hooks/useForecast.ts) | computeForecast(month, transactions, budgets) |
| useFixedExpenses | [src/hooks/useFixedExpenses.ts](src/hooks/useFixedExpenses.ts) | Lista, add, delete |
| useFinancialProfile | [src/hooks/useFinancialProfile.ts](src/hooks/useFinancialProfile.ts) | monthly_income, pay_day, upsertProfile |

Libs: [src/lib/journey.ts](src/lib/journey.ts) (score, missões, próximo passo), [src/lib/forecast.ts](src/lib/forecast.ts), [src/lib/transaction-utils.ts](src/lib/transaction-utils.ts), [src/lib/mindful-utils.ts](src/lib/mindful-utils.ts).

---

### 5. Microcopy

- Espalhado nos componentes; não há arquivo central.
- Fase 1 introduz `src/content/microcopy.ts` (PT-BR).

---

### 6. Decisões (antes/depois)

- Será preenchido ao implementar cada fase.
- Layout global (sidebar/topbar) permanece intacto na Fase 1.

---

## Decisões por fase (atualizadas na implementação)

*(Será atualizado conforme a implementação avança.)*
