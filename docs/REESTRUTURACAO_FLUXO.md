# Reestruturação Fluxo — Modelo mental (referência Mobills)

Resumo do que foi implementado e do que ficou para depois.

---

## 1. Dashboard (Visão mensal)

**Alterado:**
- **Seletor de mês** visível no topo (anterior/próximo).
- **Cards principais:** Gastos do mês, Receitas, Saldo atual (sem poluir com muitos números).
- **Gráfico por categoria** (pizza) + lista de categorias com valores.
- **Últimas transações** do mês (lista curta com data, descrição, categoria, valor com cor).
- **Próximo passo recomendado:** primeira missão do mês não concluída, com CTA (Importar extrato, Categorizar, Criar orçamento, Ver relatório).
- **Score financeiro do mês** (0–100), baseado em orçamento, categorização e controle.
- **Missões do mês:** checklist (Importar extrato, Categorizar lançamentos, Criar orçamento, Ver relatório).
- **Forecast compacto:** só aparece quando há risco de estourar orçamento; mostra “No ritmo atual, estoura em X dias” e “Reduzir R$ X/dia”.

**Removido/simplificado:**
- Fluxo de caixa (Renda / Obrigações / Disponível) e “Próximos vencimentos” para não poluir o dashboard.
- Gráfico “Evolução do saldo” e bloco “Metas e Orçamentos” duplicado.
- Insights Mindful movidos para relatórios; no dashboard ficou foco em visão do mês + próximo passo + score.

---

## 2. Transações (Lançamentos)

**Alterado:**
- **Lista em ordem cronológica** (cards por lançamento) em vez de tabela.
- **Filtros:** Tipo (Todos / Gasto / Receita), Categoria, Período (Todo período / Este mês / Mês passado).
- **Busca rápida** por descrição ou categoria.
- **Cores só no valor:** verde para receita, vermelho para gasto; resto neutro.
- **Resumo do período:** Receitas, Gastos, Saldo (ao final da lista).
- **Nomenclatura:** título “Lançamentos”, “Excluir lançamento” no dialog.

**Mantido:**
- Edição via drawer (não inline ainda); dropdown Editar/Excluir por item.
- Botão “Nova Transação” no header (Layout) continua como ação principal.

---

## 3. Orçamentos

**Alterado:**
- **Resumo:** Total orçado, Total gasto, **Restante do mês** (em vez de “Disponível”).
- **Forecast por categoria:** quando no ritmo atual o orçamento estoura antes do fim do mês:
  - “No ritmo atual, você estoura em X dia(s).”
  - “Ação recomendada: reduzir R$ X/dia para não estourar.”
- **Destaque visual** mantido: 80% (atenção), 100% (alerta).

**Mantido:**
- Barra de progresso por categoria, limite, gasto, restante.
- Novo orçamento por categoria; exclusão.

---

## 4. Relatórios

**Alterado:**
- **Comparação mensal:** Este mês vs Mês passado (gastos) com variação em %.
- **Categorias mais caras:** lista ordenada (todo período), top 8.
- **Relatório por comportamento:** seção com título “Relatório por comportamento” (Essencial, Opcional, Emocional) — distribuição (pizza) e evolução mensal (barras).
- Textos e labels em linguagem simples (gastos, análise, comportamento).

**Mantido:**
- Gráficos com Recharts; cores e estrutura já existentes.

---

## 5. Importação de extrato

**Alterado:**
- **Resumo antes de confirmar:** card “Resumo do extrato” com:
  - “Você vai importar X lançamentos.”
  - “R$ X em gastos” e “R$ X em receitas” quando houver.
  - Instrução para revisar categorias e clicar em “Importar extrato”.
- **CTA principal:** botão “Importar extrato” (em vez de “Confirmar importação”).
- `data-tour="fluxia-import-confirm"` no botão para o Flux.ia.

**Mantido:**
- Preview completo, deduplicação, opção de incluir duplicadas, tabela de revisão e bulk actions.

---

## 6. Assistente Flux.ia

**Alterado:**
- **Intent “Onde estou gastando mais?”:** mapeado para relatórios; resposta explica categorias mais caras e relatório por comportamento.
- **Quick actions:** “Como importar extrato?”, “Onde estou gastando mais?”, “Como criar orçamento?”, “Adicionar gasto”.
- **Textos do assistente:** linguagem simples (extrato, orçamento, limite, “O Fluxo avisa quando estoura”).
- **Playbook Relatórios:** passo único com `data-tour="fluxia-reports-page"` e id do playbook `VER_RELATORIOS` para “Me guiar” abrir a página e mostrar o passo.

**Mantido:**
- Botão flutuante fixo; drawer com histórico; guia visual (blur, spotlight, setas) via TourProvider; playbooks Importar e Nova Transação.

---

## 7. Jornada e hábito

**Implementado:**
- **Score financeiro (0–100):** calculado em `src/lib/journey.ts` (orçamento respeitado, categorização, ter orçamento). Exibido no dashboard.
- **Missões do mês:** Importar extrato, Categorizar lançamentos (ex.: 5), Criar orçamento, Ver relatório. Estado em `localStorage` por usuário e mês.
- **Próximo passo recomendado:** primeira missão não concluída, com CTA para a tela certa.
- **Checklist “Missões do mês”** no dashboard (checkmarks).
- **Streak:** função em `journey.ts` (meses seguidos com score ≥ 70), persistida em `localStorage`; ainda não exibida na UI.

**Arquivo novo:** `src/lib/journey.ts` (getMissionsForMonth, getFinancialScore, getRecommendedNextStep, getStreak, updateStreak, markMissionDone).

---

## 8. Nomenclatura

**Termos usados na UI:**
- Gastos (não “Despesas”).
- Receitas.
- Orçamento / Total orçado / Total gasto / Restante do mês.
- Extrato / Importar extrato.
- Saldo / Saldo atual.
- Lançamentos (na tela de transações e no resumo da importação).

**Evitado:** “Transações financeiras”, “Movimentações” nos textos principais.

---

## 9. Forecast (lib)

**Alterado:**
- **CategoryForecast:** novo campo `daysUntilOverflow: number | null` (dias até estourar no ritmo atual).
- Usado no Dashboard (bloco “Atenção ao orçamento”) e em Orçamentos (card por categoria).

---

## O que ficou para depois

- **Streak na UI:** lógica em `journey.ts`; exibir “X meses seguidos” no dashboard ou em um card de hábito.
- **Edição inline** de lançamentos (hoje é pelo drawer).
- **“Aprender com correções”** na importação (memorizar categoria por descrição/valor) — não implementado.
- **Filtro por período** em Relatórios (hoje comparação e categorias usam todo período ou mês atual/passado fixo).
- **Contas fixas** continuam em menu e tela própria; não foram integradas ao modelo de “missões” nem ao score.

---

## Arquivos modificados / criados

| Arquivo | Ação |
|--------|------|
| `src/lib/journey.ts` | Criado |
| `src/lib/forecast.ts` | Alterado (daysUntilOverflow) |
| `src/app/components/Dashboard.tsx` | Reestruturado |
| `src/app/components/Transactions.tsx` | Reestruturado (lista + filtros) |
| `src/app/components/Pages.tsx` | Orçamentos (forecast, labels), Relatórios (comparação, categorias, labels), data-tour Relatórios |
| `src/app/App.tsx` | onGoToImport no Dashboard |
| `src/features/importer/ImportPreviewPage.tsx` | Resumo + CTA “Importar extrato” |
| `src/fluxia/assistant/intentRouter.ts` | Intents e textos (extrato, gastando mais, orçamento, lançamento) |
| `src/fluxia/ui/FluxiaDrawer.tsx` | Quick actions e perguntas |
| `src/fluxia/tour/playbooks.ts` | RELATORIOS → VER_RELATORIOS, steps do playbook Relatórios |
| `docs/REESTRUTURACAO_FLUXO.md` | Criado (este arquivo) |

Build conferido: `npm run build` concluído com sucesso.
