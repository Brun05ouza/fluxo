# Dashboard — inventário de dados e fontes

Documentação de **tudo** que o componente `Dashboard` consome, calcula, exibe ou persiste.  
**Arquivo do componente:** `src/app/components/Dashboard.tsx`  

O conteúdo do Dashboard é renderizado **dentro** do `AppLayout`, na área rolável:

`main` → `div.flex-1.overflow-y-auto.p-4.md:p-8.scroll-smooth` → `{children}` (rota `/`).

---

## 1. Hooks de dados (React)

| Hook | Origem | O que traz | Uso no Dashboard |
|------|--------|------------|------------------|
| `useAuth()` | `@/contexts/AuthContext` | `user` (sessão Supabase) | `user?.id` para score, missões, streak |
| `useTransactions()` | `@/hooks/useTransactions` | `transactions`, `loading` | Lista completa; filtrada por mês na UI |
| `useBudgets(user?.id)` | `@/hooks/useBudgets` | `budgets` | Score, forecast, missões, sugestões, KPIs indiretos |
| `useFixedExpenses(user?.id)` | `@/hooks/useFixedExpenses` | `expenses` (contas fixas) | Card “Contas fixas do mês” |
| `useFinancialProfile(user?.id)` | `@/hooks/useFinancialProfile` | `profile` | `monthly_income` → % renda vs contas fixas |
| `useForecast(monthKey, transactions, budgets)` | `@/hooks/useForecast` | resultado de `computeForecast` | Alerta “Atenção ao orçamento” |
| `useSearchParams()` | `react-router-dom` | query string | Banner pós-importação |

**Backend implícito:** `transactions` e `budgets` vêm do **Supabase** (via hooks). Perfil e contas fixas idem.

---

## 2. Estado local (useState)

| Estado | Tipo / uso |
|--------|------------|
| `selectedYear` | Ano do mês exibido (inicial: ano atual) |
| `selectedMonth` | Mês 1–12 (inicial: mês atual) |

Navegação: botões anterior/próximo mês (`prevMonth` / `nextMonth`).

---

## 3. Chave do mês e filtro principal

- **`currentMonthKey`:** `YYYY-MM` (`getMonthKey(selectedYear, selectedMonth)`).
- **`txForMonth`:** `transactions` cuja `date` começa com o prefixo `YYYY-MM` (mesmo critério que o restante do mês na UI).

**Campos de `Transaction` mais usados no Dashboard:**

- `date`, `amount`, `category`, `title`, `id`
- `spending_type` (gastos emocionais / mindful)
- Indiretamente via saldo em caixa: `transaction_kind`, `settlement_status`, `is_paid`, `is_ignored` (via `getEffectiveCashBalance` → `balance-engine`)

---

## 4. Métricas derivadas do mês selecionado (`txForMonth`)

| Variável | Função / origem | Significado |
|----------|-----------------|-------------|
| `income` | `getIncomeTotal(txForMonth)` | Soma de `amount > 0` (todas as receitas do mês na competência da data) |
| `expense` | `getExpenseTotal(txForMonth)` | Soma dos valores absolutos de `amount < 0` |
| `balance` | `getEffectiveCashBalance(txForMonth)` | **Saldo em caixa** no mês: só lançamentos com impacto de caixa **quitado** (não inclui a pagar/a receber) |
| `dataPie` | `getPieDataFromTransactions(txForMonth)` | Gastos por categoria (só despesas); cores fixas em lista |
| `latestTx` | ordenação manual | Até **5** transações do mês, `date` desc |
| `withCategoryCount` | filtro manual | Despesas (`amount < 0`) com `category` definida e ≠ `'Outros'` |

**Arquivo:** `src/lib/transaction-utils.ts` (totais e pizza).  
**Saldo em caixa:** `src/features/finance/domain/balance-engine.ts` (`getEffectiveCashBalance`).

---

## 5. Forecast e alerta de orçamento

- **`forecast`** = `useForecast` → `computeForecast(month, transactions, budgets)` em `src/lib/forecast.ts`.
- **Card “Atenção ao orçamento”** aparece se existe categoria em `forecast.byCategory` com  
  `daysUntilOverflow !== null` **e** `daysUntilOverflow <= daysRemaining`.

Usa **todas** as transações + orçamentos para o cálculo do mês (não só `txForMonth` no hook — o mês é passado como string `YYYY-MM`).

**Campos relevantes em `forecast.byCategory` na UI:** `category`, `daysUntilOverflow`, `daysRemaining`, `suggestedDailyLimit`.

---

## 6. Jornada: score, missões, próximo passo, streak

**Arquivo:** `src/lib/journey.ts`

| Export | Entrada principal | Saída / efeito |
|--------|-------------------|----------------|
| `getFinancialScore(monthKey, transactions, budgets)` | Mês + txs + budgets | Número 0–100 → `ScoreRadial` |
| `getScoreSuggestions(monthKey, transactions, budgets)` | Idem | Até 3 strings abaixo do score |
| `getRecommendedNextStep(userId, monthKey, { transactions, budgets })` | Idem + userId | Próxima missão não concluída + CTA |
| `getMissionsForMonth(userId, monthKey, { transactions, budgets })` | Idem | Lista de missões com `done`, `label`, `id` |
| `updateStreak(userId, monthKey, score)` | `useEffect` quando `score >= 0` | Persiste streak em **localStorage** |

**localStorage (jornada):**

- `fluxo_missions_${userId}` — estado das missões por mês.
- `fluxo_streak_${userId}` — sequência de meses com bom score (ver implementação em `journey.ts`).

**Missões padrão (IDs):** `import_extrato`, `categorizar_transacoes`, `criar_orcamento`, `visualizar_insight`.  
Regras resumidas: import = há transações no app; categorizar = ≥5 lançamentos do mês com categoria ≠ Outros; orçamento = `budgets.length > 0`; insight = flag opcional `hasViewedReportsThisMonth` (não passada pelo Dashboard → depende de estado salvo).

---

## 7. Contas fixas e perfil financeiro

| Variável | Cálculo |
|----------|---------|
| `fixedTotal` | Soma `amount` de `fixedExpenses` com `is_active` |
| `monthlyIncome` | `financialProfile?.monthly_income ?? 0` |
| `fixedPercentOfIncome` | `round((fixedTotal / monthlyIncome) * 100)` se `monthlyIncome > 0`, senão `null` |

---

## 8. Gastos emocionais (teaser)

- **`getSpendingTypeDistribution(txForMonth)`** — `src/lib/mindful-utils.ts`
- Considera só despesas (`amount < 0`) **com** `spending_type`.
- Agrega `ESSENTIAL`, `OPTIONAL`, `EMOTIONAL`.
- **% exibido:** `emotionalTotal / totalExpenses * 100` (despesas totais do mês em valor absoluto).

---

## 9. “Ação principal do mês” (`dominantAction`)

Lógica em `useMemo` (prioridade de cima para baixo):

1. **`txForMonth.length === 0`:** importar + opcional “Adicionar transação” (`emptyStates.dashboard`, `dashboardActionTitles.importFirst`).
2. **`withCategoryCount < 5`:** categorizar (`dashboardActionTitles.categorize`).
3. **`budgets.length === 0`:** criar orçamento (`dashboardActionTitles.createBudget`).
4. **`!nextStep`:** ver relatório (`dashboardActionTitles.seeReport`).
5. **`nextStep` existe:** título e CTA vindos da missão recomendada (`handleMissionCta` → rotas import / transações / orçamentos / relatório).

---

## 10. Query string (URL)

| Parâmetro | Uso |
|-----------|-----|
| `import=success` | Mostra `SuccessBanner` |
| `importCount` | Substitui `{count}` em `success.importDone` |

Dismiss limpa params com `setSearchParams({})`.

---

## 11. Microcopy (`@/content/microcopy`)

Chaves usadas no Dashboard:

- **`emptyStates.dashboard`:** título, descrição, bullets, CTAs primário/secundário.
- **`labels`:** `visaoDoMes`, `kpiGastos`, `kpiReceitas`, `kpiSaldo`, `acaoPrincipal`, `scoreDoMes`, `missoesDoMes`, `contasFixasDoMes`, `percentualRenda`, `gerenciarContasFixas`.
- **`hints.score`**
- **`success.importDone`**, **`success.importDoneCta`**
- **`dashboardActionTitles`:** importFirst, categorize, createBudget, seeReport.
- **`ctas.verRelatorioComportamento`**

Textos **hardcoded** no componente (não vêm do microcopy):

- Título “Gastos emocionais” e parágrafos do teaser.
- “Gastos por categoria”, “Últimas transações”, “Nenhum gasto neste mês”, “Nenhuma transação neste mês”.
- Card “Atenção ao orçamento” e lista de alertas + botão “Ajustar orçamentos”.
- Alguns CTAs da ação principal (“Categorizar lançamentos”, “Criar orçamento”, “Ver relatório do mês”).

---

## 12. Props do Dashboard (callbacks)

Recebidas do `App` / rota:

- `onAddTransaction`, `onGoToTransactions`, `onGoToBudgets`, `onGoToFixedExpenses`, `onGoToReports`, `onGoToImport`, `onGuideClick`

Controlam navegação e abertura do drawer; **não** são fonte de dados numéricos.

---

## 13. Componentes de UI utilizados

- **Lucide:** `ArrowRight`, `ChevronLeft`, `ChevronRight`, `Target`, `Sparkles`, `CheckCircle2`, `Circle`, `Upload`
- **Recharts:** `ResponsiveContainer`, `PieChart`, `Pie`, `Cell`, `Tooltip`
- **Framer Motion:** `motion.div` (fade-in)
- **`./ui`:** `Card`, `Button`, `cn`
- **`./patterns`:** `KPIGroup`, `SectionCard`, `PrimaryCTA`, `EmptyState`, `SuccessBanner`, `ScoreRadial`, `InlineHint`
- **`ChartTooltip`** — componente local no arquivo (tooltip do gráfico)

---

## 14. Formatação

- **`formatCurrencyBRL`** — `src/lib/format-currency.ts` (valores em BRL).
- Datas na lista “Últimas transações”: `new Date(tx.date).toLocaleDateString('pt-BR')`.

---

## 15. Loading

Enquanto `useTransactions().loading === true`, o Dashboard mostra apenas um spinner centralizado (não renderiza o restante).

---

## 16. Resumo rápido: de onde vem cada número na tela

| Na tela | Fonte |
|---------|--------|
| Gastos do mês | Soma despesas (`amount < 0`) de `txForMonth` |
| Receitas | Soma receitas (`amount > 0`) de `txForMonth` |
| Saldo em caixa | `getEffectiveCashBalance(txForMonth)` (quitados) |
| Pizza + legenda | Despesas por `category` em `txForMonth` |
| Últimas 5 | `txForMonth` ordenado por `date` |
| Score | `getFinancialScore` + `computeForecast` + regras em `journey.ts` |
| Missões | `getMissionsForMonth` + **localStorage** |
| Contas fixas | Hook `useFixedExpenses` |
| % renda fixas | `fixedTotal` / `monthly_income` do perfil |
| Alerta orçamento | `forecast.byCategory` (`computeForecast`) |
| % emocional | `getSpendingTypeDistribution` em `txForMonth` |

---

*Gerado com base no código em `Dashboard.tsx` e dependências diretas. Se algum hook ou lib mudar, atualize este arquivo.*
