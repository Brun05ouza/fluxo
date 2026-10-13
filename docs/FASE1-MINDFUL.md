> Documento histórico adaptado para Neon. Para configuração vigente, consulte README.md e neon/migrations; números de migrations e instruções de buckets anteriores são históricos.

# FASE 1 — Mindful Finance (concluída)

## Alterações no banco

### Migration 004_spending_type.sql
- Coluna `spending_type` em `transactions` (nullable, default NULL)
- Valores: `ESSENTIAL`, `OPTIONAL`, `EMOTIONAL`
- Índice parcial: `idx_transactions_spending_type` (WHERE spending_type IS NOT NULL)

**Executar no SQL Editor do Neon (schema atual em neon/migrations)** antes de testar.

---

## UI

### Nova transação (TransactionDrawer)
- Seletor visual de 3 opções: Essencial, Opcional, Emocional
- Exibido apenas para **gastos** (não para receitas)
- Campo opcional — transações antigas permanecem com `spending_type` NULL

### Relatórios (Reports)
- **Distribuição por tipo**: gráfico de pizza + legenda
- **Evolução mensal**: gráfico de barras (ESSENTIAL, OPTIONAL, EMOTIONAL)
- Empty state quando não há dados com `spending_type`

### Insights (Dashboard)
- Cards "Insights Mindful" quando há dados relevantes
- Regras:
  - Gasto emocional acima da média (este mês > 120% da média dos últimos 3 meses)
  - Tendência de aumento (gasto emocional cresceu 15%+ entre meses)
  - Primeira classificação emocional (informativo)

---

## Arquivos criados/alterados

| Arquivo | Descrição |
|---------|-----------|
| `neon/migrations/004_spending_type.sql` | Migration incremental |
| `src/types/database.ts` | SpendingType, SPENDING_TYPES, Transaction.spending_type |
| `src/app/components/TransactionDrawer.tsx` | Seletor de tipo de gasto |
| `src/lib/mindful-utils.ts` | Distribuição, evolução, médias |
| `src/lib/mindful-insights.ts` | Regras de insights |
| `src/app/components/Pages.tsx` | Reports com gráficos Mindful |
| `src/app/components/Dashboard.tsx` | Seção Insights Mindful |
