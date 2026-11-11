# Levantamento para banca — Fluxo

Documento de **fatos** com evidência `arquivo:linha`.  
Modo somente leitura: nenhum arquivo existente foi editado; nenhum script escreveu no banco.

**Teste do Flux.ia:** `detectIntent` foi executado em memória via `npx tsx -e` (import de `src/fluxia/assistant/intentRouter.ts`), sem criar arquivos. Resultados da seção A.5 vêm dessa execução (2026-11-10).

---

## A. FLUX.IA

Fontes: `src/fluxia/assistant/intentRouter.ts`, `src/fluxia/assistant/types.ts`, `src/fluxia/ui/FluxiaDrawer.tsx`, `src/fluxia/tour/playbooks.ts`.

### A.1 Lista completa de intenções

#### Intents especiais (antes do array `INTENTS`)

| Intent | Disparo | Texto exato da resposta | openPage | Guia (títulos dos passos) |
|--------|---------|-------------------------|----------|---------------------------|
| `HELP` (input vazio) | `!normalized` | `Como posso te ajudar?\n\n` + `SUGGESTIONS` | — | sem guia (`hasGuide: false`) |
| `GREETING` | `GREETING_RE` / `GREETING_SOFT_RE` | Um de: `Oi! Eu sou o Flux.ia. Como posso te ajudar hoje?` · `Olá! Pronto para organizar suas finanças. Em que posso ajudar?` · `E aí! Me diga o que você quer fazer no Fluxo.` + `\n\n` + `SUGGESTIONS` | — | sem guia |
| `THANKS` | `THANKS_RE` | `Por nada! Se precisar de mais alguma coisa, é só chamar.` | — | sem guia |
| `FAREWELL` | `FAREWELL_RE` | `Até logo! Qualquer dúvida, estou por aqui.` | — | sem guia |
| `HELP` | `HELP_RE` | `Posso te guiar pelo Fluxo: importar extrato, lançar gastos, orçamentos, relatórios, score e configurações.\n\n` + `SUGGESTIONS` | — | sem guia |
| `UNKNOWN` | nenhum match | lead aleatório + ` Tenta reformular ou escolhe uma das opções abaixo.\n\n` + `SUGGESTIONS` | — | sem guia |

Regex especiais literais (`intentRouter.ts:188-201`):

```
GREETING_RE = /^(oi+|ola+|olá+|oii+|oie|hey|hi|hello|eai|e ai|eae|opa|fala|falai|salve|bom dia|boa tarde|boa noite|e ai( beleza)?|tudo bem\??|td bem\??|beleza\??|blz\??)[\s!?.😊👋]*$/i
GREETING_SOFT_RE = /^(oi+|ola+|olá+|hey|hi)\b.{0,40}$/i
THANKS_RE = /^(obrigad[oa]s?|valeu|vlw|tmj|thanks|thank you|muito obrigad[oa]|obg|brigad[oa])[\s!?.]*$/i
FAREWELL_RE = /^(tchau|xau|ate logo|até logo|flw|falou|bye|goodbye|ate mais|até mais|fui)[\s!?.]*$/i
HELP_RE = /(^|\b)(ajuda|help|socorro|o que (voce|vc|tu) (faz|pode)|como (funciona|usar)|o que (posso|da pra|dá pra) (perguntar|fazer)|me (ajuda|explica)|nao sei (usar|por onde)|não sei (usar|por onde)|comandos|opcoes|opções|menu)(\b|$)/i
```

`SUGGESTIONS` literal (`intentRouter.ts:203-204`):

```
Você pode perguntar, por exemplo:
• "Como importo o extrato?"
• "Adicionar um gasto"
• "Criar orçamento"
• "Onde estou gastando mais?"
• "Como funciona o score?"
```

Leads de UNKNOWN (`intentRouter.ts:296-300`):

1. `Hmm, não entendi bem "${trimmed}".`
2. `Não reconheci essa mensagem.`
3. `Ainda não sei responder isso exatamente.`

#### Array `INTENTS` (ordem = prioridade no loop)

##### 1. `IMPORT_EXTRATO` — `intentRouter.ts:12-33`

**Keywords (todas, literais):**
- `'importar'`
- `'extrato'`
- `'csv'`
- `'ofx'`
- `'banco'`
- `'arquivo'`
- `'planilha'`
- `/importa(r|cao|r extrato)/i`
- `/extrato (do |da )?banco/i`
- `/onde (importo|importar)/i`
- `/como importar/i`
- `/subir (o )?arquivo/i`
- `/carregar (o )?extrato/i`
- `/trazer (meus )?lancamentos/i`

**text:** `Para importar seu extrato: vá em Importar no menu, arraste o arquivo CSV na área indicada (hoje só CSV é aceito). Revise as categorias e clique em "Importar extrato" para confirmar.`

**hasGuide:** `true` · **openPage:** `/import`

**Guia** (`playbooks.ts` `IMPORTAR_EXTRATO`, alias `IMPORT_EXTRATO` → `IMPORTAR_EXTRATO`): Menu Importar · Área de upload · Ajuda por banco

##### 2. `NOVA_TRANSACAO` — `intentRouter.ts:34-52`

**Keywords (todas):**
- `'nova transacao'`
- `'adicionar gasto'`
- `'adicionar receita'`
- `'registrar gasto'`
- `'lancamento'`
- `'despesa'`
- `'receita'`
- `/(adicionar|nova|novo|registrar|criar) (um |uma )?(gasto|transacao|receita|despesa|lancamento)/i`
- `/como (adiciono|adicionar|registro|registrar|lanço|lancar)/i`
- `/quero (registrar|adicionar|lancar)/i`
- `/anotar (um )?gasto/i`

**text:** `Para adicionar um lançamento: no menu lateral, em "Nova transação", escolha Receita ou Despesa e preencha valor, descrição, data e categoria.`

**hasGuide:** `true` · **openPage:** `/`

**Guia:** Tipo de lançamento · Valor · Descrição · Categoria · Data · Forma de pagamento · Tipo de gasto · Repetir · Salvar

##### 3. `CRIAR_ORCAMENTO` — `intentRouter.ts:53-69`

**Keywords (todas):**
- `'orcamento'`
- `'limite'`
- `'categoria mensal'`
- `/criar orcamento/i`
- `/definir limite/i`
- `/(onde|como) (crio|criar|faco|fazer) orcamento/i`
- `/controlar (meus )?gastos/i`
- `/limite (por |de )?categoria/i`
- `/meta (de )?gasto/i`

**text:** `Para criar orçamento por categoria: vá em Orçamentos no menu. Defina o limite em reais para cada categoria. O Fluxo avisa quando você se aproxima ou estoura o limite.`

**hasGuide:** `true` · **openPage:** `/budgets`

**Guia:** Menu Orçamentos · Novo orçamento · Categoria e limite

##### 4. `VER_RELATORIOS` — `intentRouter.ts:70-92`

**Keywords (todas):**
- `'relatorio'`
- `'grafico'`
- `'resumo'`
- `'visao geral'`
- `'onde gasto'`
- `'gastando mais'`
- `'onde estou gastando'`
- `'analise'`
- `/ver relatorio/i`
- `/onde (vejo|ver) (os )?relatorios/i`
- `/onde (estou )?gastando mais/i`
- `/(onde|em que) (gasto|estou gastando)/i`
- `/meus gastos/i`
- `/como (estao|estão) (meus )?gastos/i`
- `/ver (o )?painel|dashboard|analise financeira/i`

**text:** `No menu "Contas", abra a aba "Análise" para ver onde está gastando mais, categorias mais caras e evolução por tipo (Essencial, Opcional, Emocional).`

**hasGuide:** `true` · **openPage:** `/reports/analise`

**Guia:** Menu Contas · Análise

##### 5. `GERENCIAR_CATEGORIAS` — `intentRouter.ts:93-105`

**Keywords (todas):**
- `'categoria'`
- `'categorias'`
- `'editar categoria'`
- `'organizar'`
- `/(gerenciar|editar|organizar|mudar) categoria/i`
- `/classificar (gastos|lancamentos)/i`

**text:** `As categorias podem ser ajustadas durante a importação ou na tela de transações, ao editar cada lançamento.`

**hasGuide:** `true` · **openPage:** NÃO ENCONTRADO (`undefined`)

**Guia** (alias `CATEGORIAS`): Transações · Filtrar por categoria

##### 6. `CONFIGURACOES` — `intentRouter.ts:106-123`

**Keywords (todas):**
- `'configuracao'`
- `'config'`
- `'configuracoes'`
- `'tema'`
- `'ajustes'`
- `'perfil'`
- `/onde (esta|ficam|fica) (as )?configuracoes/i`
- `/(mudar|alterar) (o )?tema/i`
- `/modo (escuro|claro)/i`
- `/dark mode|light mode/i`

**text:** `As configurações ficam no menu lateral. Lá você pode alterar tema, perfil e outras opções.`

**hasGuide:** `true` · **openPage:** `/settings`

**Guia** (alias `CONFIGURACOES_TEMA`): Menu Configurações · Aparência

##### 7. `ENTENDER_SCORE` — `intentRouter.ts:124-139`

**Keywords (todas):**
- `'score'`
- `'entender score'`
- `'como funciona o score'`
- `'o que e o score'`
- `'pontuacao'`
- `/(entender|o que e|como funciona) (o )?score/i`
- `/score (do mes|financeiro)/i`
- `/minha nota|pontos do mes/i`

**text:** `O score vai de 0 a 100 e reflete orçamento, categorização e controle do mês. Quanto maior, melhor. Abaixo do score aparecem sugestões do que fazer para subir (ex.: criar orçamento, categorizar lançamentos).`

**hasGuide:** `true` · **openPage:** `/`

**Guia:** Score do mês · Sugestões para subir

##### 8. `ENTENDER_RELATORIO` — `intentRouter.ts:140-154`

**Keywords (todas):**
- `'entender relatorio'`
- `'relatorio comportamento'`
- `'essencial opcional emocional'`
- `/(entender|explicar) (o )?relatorio/i`
- `/relatorio (por )?comportamento/i`
- `/essencial opcional emocional/i`
- `/gasto emocional|gasto essencial/i`

**text:** `No relatório por comportamento, os gastos são classificados em Essencial (necessário), Opcional (conforto) e Emocional (impulso). Marque o tipo ao editar cada transação para ver a análise.`

**hasGuide:** `true` · **openPage:** `/reports/analise`

**Guia:** Ir para Análise · Comportamento

##### 9. `CONTAS_FIXAS` — `intentRouter.ts:155-170`

**Keywords (todas):**
- `'conta fixa'`
- `'contas fixas'`
- `'obrigacao'`
- `'aluguel'`
- `'assinatura'`
- `/despesa(s)? fixa(s)?/i`
- `/contas? (do )?mes/i`
- `/(luz|agua|internet|energia)/i`

**text:** `Em Contas fixas no menu você cadastra obrigações mensais (aluguel, luz, assinaturas). Informe nome, valor e dia do vencimento para acompanhar o total do mês.`

**hasGuide:** `false` · **openPage:** `/fixed-expenses` · **Guia:** NÃO ENCONTRADO

##### 10. `CONTAS` — `intentRouter.ts:171-185`

**Keywords (todas):**
- `'minhas contas'`
- `'carteira'`
- `'conta bancaria'`
- `'cartao'`
- `/abrir conta/i`
- `/gerenciar contas/i`
- `/saldo (da |das )?contas?/i`

**text:** `Em Contas você organiza carteiras, bancos e cartões. O saldo e o que entra na soma da tela inicial podem ser ajustados por conta.`

**hasGuide:** `false` · **openPage:** `/reports` · **Guia:** NÃO ENCONTRADO

**Playbook órfão (existe no tour, sem intent de chat):** `FILTRAR_TRANSACOES` — títulos: Menu Transações · Busca · Filtros (`playbooks.ts:104-132`). NÃO ENCONTRADO em `INTENTS` / `INTENT_ALIASES`.

---

### A.2 Como `detectIntent` decide

Evidência: `intentRouter.ts:206-306`.

**Normalização** (`normalizeInput`, linhas 206-212):
1. `toLowerCase()`
2. `normalize('NFD')`
3. remove diacríticos: `.replace(/[\u0300-\u036f]/g, '')` (acentos; `ç`→`c`)
4. `trim()`
5. **não** remove pontuação

**Entradas usadas:** `trimmed = userInput.trim()`; `normalized = normalizeInput(trimmed)`.

**Ordem de prioridade:**
1. vazio → `HELP`
2. saudação (`GREETING_RE` em `trimmed`/`normalized`, ou `GREETING_SOFT_RE` em `normalized`)
3. agradecimento (`THANKS_RE`)
4. despedida (`FAREWELL_RE`)
5. ajuda (`HELP_RE`)
6. loop `INTENTS` **na ordem do array** (primeiro match vence)
7. `UNKNOWN`

**Comparação** (`matchKeywords`, linhas 227-241):
| Tipo de keyword | Comparação |
|-----------------|------------|
| string com `length ≤ 3` | quase palavra inteira: `RegExp(?:^|\s)needle(?:\s|$|[!?.,])` testado em `normalized` |
| string com `length > 3` | substring: `normalized.includes(needle)` |
| `RegExp` | `kw.test(original)` **ou** `kw.test(normalized)` |

**Plural / morfologia:** NÃO ENCONTRADO stemming genérico. Só o que está hardcoded (ex.: `categorias`, `despesa(s)? fixa(s)?`). `includes("categoria")` casa dentro de `"categorias"`; o inverso (`"transacao"` → `"transacoes"`) **não** casa.

---

### A.3 Flux.ia e banco Neon

**Confirmado: nenhuma consulta do Flux.ia ao Neon.**

- `detectIntent` é só strings/regex locais (`intentRouter.ts:244-306`).
- O drawer chama `detectIntent(trimmed)` (`FluxiaDrawer.tsx:102`) e, se `hasGuide`, navega + `startTour` (`74-83`).
- Em `src/fluxia/`: NÃO ENCONTRADO `neon`, `from(`, `rpc(`, `fetch` de API financeira. (Único “query” do tour: `document.querySelector` no DOM.)

---

### A.4 Ações rápidas e “não entendi”

**Ações rápidas** (`FluxiaDrawer.tsx:18-24`):
| Label na UI | intent |
|-------------|--------|
| `Como importar extrato?` | `IMPORT_EXTRATO` |
| `Onde estou gastando mais?` | `VER_RELATORIOS` |
| `Como criar orçamento?` | `CRIAR_ORCAMENTO` |
| `Adicionar gasto` | `NOVA_TRANSACAO` |
| `Entender score` | `ENTENDER_SCORE` |

Texto enviado ao clicar (`FluxiaDrawer.tsx:124-136`):  
`Como importar extrato?` · `Como adiciono um gasto?` · `Como criar orçamento?` · `Onde estou gastando mais?` · `Como funciona o score?`

**“Não entendi”:** ver leads UNKNOWN em A.1 + sufixo ` Tenta reformular ou escolhe uma das opções abaixo.\n\n` + `SUGGESTIONS` (`intentRouter.ts:296-306`).

---

### A.5 Resultado por frase (execução real `npx tsx -e`)

| Frase | Intent | Palavra / padrão que casou (análise do código) |
|-------|--------|-----------------------------------------------|
| `como fazer transações` | `UNKNOWN` | nenhum |
| `como registrar uma transação` | `NOVA_TRANSACAO` | regex `/(adicionar\|nova\|novo\|registrar\|criar) (um \|uma )?(gasto\|transacao\|…)/i` (também `/como (…\|registrar\|…)/i`) |
| `como adiciono uma despesa` | `NOVA_TRANSACAO` | string `'despesa'` (`includes`) |
| `quero lançar um gasto` | `NOVA_TRANSACAO` | `/quero (registrar\|adicionar\|lancar)/i` em `normalized` (`lançar`→`lancar`) |
| `como cadastrar uma receita` | `NOVA_TRANSACAO` | string `'receita'` (`includes`) |
| `como importar meu extrato` | `IMPORT_EXTRATO` | string `'importar'` (primeiro keyword) |
| `como vincular um lançamento` | `NOVA_TRANSACAO` | string `'lancamento'` (`includes`) — **não** há intent de vincular |
| `como preparar o mês` | `UNKNOWN` | nenhum |
| `o que é previsão` | `UNKNOWN` | nenhum |
| `como funciona o orçamento` | `HELP` | `HELP_RE` casa `como funciona` **antes** do loop `INTENTS` |
| `como definir um limite por categoria` | `CRIAR_ORCAMENTO` | string `'limite'` |
| `como cadastrar conta fixa` | `CONTAS_FIXAS` | string `'conta fixa'` |
| `onde vejo meus gastos por categoria` | `VER_RELATORIOS` | `/meus gastos/i` (antes de `'categoria'`) |
| `como excluir uma transação` | `UNKNOWN` | nenhum |
| `o que é o score` | `ENTENDER_SCORE` | string `'score'` |
| `como mudar o tema` | `CONFIGURACOES` | string `'tema'` (também `/(mudar\|alterar) (o )?tema/i`) |
| `oi` | `GREETING` | `GREETING_RE` (`oi+`) |
| `obrigada` | `THANKS` | `THANKS_RE` (`obrigad[oa]s?`) |
| `que dia é hoje` | `UNKNOWN` | nenhum |

---

## B. ORÇAMENTO

### B.1 Percentual usado, restante e barra

**Spent por categoria** — `getSpentByCategory` (`transaction-utils.ts:45-51`):
- Filtra `isBudgetExpense(t) && isSettled(t)`
- Soma `Math.abs(amount)` por `category`

**O que entra / não entra** (`financial-status.ts:2-9`):
- `isBudgetExpense`: `amount < 0`, não ignorado, `transaction_kind` **não** em `transfer` | `invoice_payment` | `adjustment`
- `isSettled`: não ignorado, `is_paid !== false`, `settlement_status !== 'pending'`
- Pendentes / ignorados / transferências **não** entram no “usado” da barra

**Percentual** — `getBudgetProgress` (`transaction-utils.ts:54-65`):
- `percent = limit > 0 ? (spent / limit) * 100 : 0`

**Restante no card** (`budgets-page.tsx:418-419`):
- `Math.max(0, budget.limit - budget.spent)` — **não** desconta previsões pendentes

**Disponível após previsões** (`budgets-page.tsx:109`, `355`):
- `committed` = despesas do mês `isBudgetExpense && !isSettled`
- `Disponível após previsões = limit - spent - committed`

**Faixas da barra** (`budgets-page.tsx:340-341`, `424-436`, `446-458`):
| Faixa | Flags | Cor texto / barra | Mensagem extra |
|-------|-------|-------------------|----------------|
| `< 80%` | — | `text-primary` / `primary` | — |
| `≥ 80%` e `< 100%` | `isCritical` | `text-orange-500` / `warning` | `Você já usou mais de 80% deste orçamento.` |
| `≥ 100%` | `isOver` | `text-destructive` / `destructive` | `Limite ultrapassado!` |

Risco no forecast (`forecast.ts:33-36`): `≥100` → `DANGER`; `≥80` → `WARNING`; senão `OK`.

---

### B.2 “No ritmo atual…” e “Ação recomendada…”

**Função:** `computeForecast` (`forecast.ts:75-163`), campos `daysUntilOverflow` e `suggestedDailyLimit`; UI em `budgets-page.tsx:438-444`.

**Fórmulas por categoria** (`forecast.ts:108-128`), mês corrente:
- `dayOfMonth = hoje.getDate()`; `daysInMonth`; `daysRemaining = max(0, daysInMonth - dayOfMonth)`
- `spent` = settled do mês na categoria
- `pending` = budget-expenses do mês **não** settled
- `fixedPaid` = settled **com** `planning_item_id`
- `remaining = max(0, limit - spent - pending)`
- `categoryDailyAvg = dayOfMonth > 0 ? (spent - fixedPaid) / dayOfMonth : 0`
- `daysUntilOverflow = floor(remaining / categoryDailyAvg)` se `limit > 0 && spent < limit && categoryDailyAvg > 0`, senão `null`
- `suggestedDailyLimit = daysRemaining > 0 ? remaining / daysRemaining : 0`

**Condição de exibição** (`budgets-page.tsx:438`):
```
daysUntilOverflow !== null
&& daysUntilOverflow <= (catForecast?.daysRemaining ?? 31)
&& !isOver
```

**Strings exatas:**
- `No ritmo atual, você estoura em {N} dia(s).` (`440`)
- `Ação recomendada: reduzir {formatCurrencyBRL(suggestedDaily)}/dia para não estourar.` (`442`)

**Nota factual de copy:** `suggestedDailyLimit` é **teto diário do restante**, não “quanto cortar do ritmo atual”. O Dashboard usa “Teto sugerido” (`Dashboard.tsx:612-614`).

#### Caso: limite 900 · gasto 576,30 · dia 10/11/2026

Hipótese alinhada ao código: mês corrente novembro/2026, **sem** pendentes e **sem** `fixedPaid` na categoria.

| Variável | Valor |
|----------|-------|
| `dayOfMonth` | 10 |
| `daysInMonth` | 30 |
| `daysRemaining` | 20 |
| `remaining` | 900 − 576,30 = **323,70** |
| `categoryDailyAvg` | 576,30 / 10 = **57,63** |
| `daysUntilOverflow` | `floor(323,70 / 57,63)` = **5** |
| `suggestedDailyLimit` | 323,70 / 20 = **16,185** → `formatCurrencyBRL` = **R$ 16,19** |
| `percent` | ≈ **64,03%** (não dispara alerta de 80%) |
| Aparece o aviso? | **Sim** (`5 ≤ 20` e não over) |

Texto esperado:
- `No ritmo atual, você estoura em 5 dia(s).`
- `Ação recomendada: reduzir R$ 16,19/dia para não estourar.`

---

### B.3 Fonte dos dados e quando recalcula

| Dado | Fonte |
|------|--------|
| Budgets | Banco Neon (`useBudgets` + `subscribeData('budgets')`) |
| Transactions | Banco Neon (`useTransactions` + `subscribeData('transactions')`) |
| Percent / barra / restante | **cálculo no navegador** (`getBudgetProgress`) |
| Forecast / overflow | **cálculo no navegador** `useForecast` → `useMemo(computeForecast, …)` (`useForecast.ts:10-13`) |

Recalcula quando mudam `transactions`, `budgets` ou o mês. NÃO ENCONTRADO RPC de forecast no servidor.

---

## C. VINCULAR

### C.1 Caminho na interface

1. **Orçamentos** (`/budgets`, `budgets-page.tsx`) ou **Dashboard** → card Planejamento (`MonthlyPlan.tsx`).
2. Botão **“Preparar mês”** → RPC `prepare_financial_month` (`MonthlyPlan.tsx:30-37`). Toast: `… previsões criadas. Confira e vincule valores já lançados.` / `Este mês já está preparado…`
3. Texto: `Se já lançou salário ou uma conta, vincule o lançamento existente em Transações.` (`MonthlyPlan.tsx:55`)
4. Menu **Transações** → `/transactions` (`Layout.tsx:191`, `App.tsx:189`).
5. Na linha da previsão: menu **⋯** → **“Vincular lançamento existente”** (`Transactions.tsx:695-706`).
6. Diálogo (`742-751`):
   - Título: `Vincular lançamento existente`
   - Descrição: `A previsão de {title} será substituída pelo lançamento escolhido. O valor e o status real desse lançamento serão preservados.`
   - Select placeholder: `Escolha o lançamento já registrado`
7. **Filtros da lista de candidatos** (`745`):
   - `!t.planning_item_id`
   - `!t.is_ignored` e `settlement_status !== 'ignored'`
   - mesmo `Math.sign(amount)` da previsão
   - mesmo mês `(competency_date||date).slice(0,7)`
8. Botão **Vincular** → `neon.rpc('link_planned_transaction', { plan_id, existing_id })` (`749`).
9. Depois: `refetchTransactions()`; toast `Lançamento vinculado. Previsão duplicada removida.`

**RPC** (`neon/migrations/005_monthly_planning.sql:58-74`):
- Atualiza `monthly_plan_items.transaction_id` → lançamento existente
- **DELETE** da previsão
- Seta `planning_item_id` no lançamento real
- Rejeita previsão paga/ignorada; existing já vinculado/ignorado; mês ou sinal incompatível

---

### C.2 Quando a opção NÃO aparece

UI exige `tx.planning_item_id && isPending` com `isPending = tx.is_paid === false` (`Transactions.tsx:618`, `706`).

**Não aparece se:**
- não tem `planning_item_id` (não é previsão do plano)
- já quitada (`is_paid !== false`)
- linha fora da lista filtrada / sem menu de ações

RPC: `Apenas previsões pendentes podem ser vinculadas` (`005_monthly_planning.sql:67`).

---

### C.3 Roteiro na conta de demonstração

1. Garantir renda em Perfil e/ou contas fixas em Contas fixas.
2. Orçamentos → **Preparar mês** (cria previsões pendentes com `planning_item_id`).
3. Criar (Nova transação) ou importar um lançamento **real** no **mesmo mês** e **mesmo sinal** (ex.: despesa vs previsão de despesa), **sem** `planning_item_id`.
4. Transações → ⋯ na previsão pendente → Vincular lançamento existente → escolher → Vincular.
5. Conferir: previsão some; lançamento real fica com `planning_item_id`.

**Bugs / riscos observados (sem corrigir):**
- Copy “reduzir R$/dia” vs fórmula de teto diário (B.2).
- Lista de candidatos pode ficar **vazia** sem empty-state dedicado (`Transactions.tsx:745`).
- Após marcar previsão como paga, some a opção Vincular (só Duplicar/Excluir).
- Intent Flux.ia “como vincular um lançamento” cai em `NOVA_TRANSACAO` por causa de `'lancamento'` (A.5) — guia de nova transação, não de vincular.

---

## D. COMPORTAMENTO (essencial / opcional / emocional)

### Existe

| Capacidade | Evidência |
|------------|-----------|
| Coluna DB `spending_type` ∈ `ESSENTIAL` \| `OPTIONAL` \| `EMOTIONAL` | `neon/migrations/002_finance.sql:71-72` |
| Labels UI | `database.ts:12-16` — Essencial / Opcional / Emocional (`Compra por impulso`) |
| Usuário informa | `TransactionDrawer.tsx:860-885` — “Tipo de gasto (Mindful)”; só em despesa; clique de novo → `null` |
| Persistência | `TransactionDrawer.tsx:344` — `spending_type: type === 'expense' ? spendingType : null` |
| Relatório Contas → Análise | `reports-page.tsx:199-294` — pizza e barras Essencial/Opcional/Emocional |
| Dashboard % emocional / textos de impulso | `Dashboard.tsx:71-79`, `271-277`, `362` |
| Utilitários de agregação | `mindful-utils.ts` |

### Não existe

| Capacidade | Evidência |
|------------|-----------|
| Score usa `spending_type` | NÃO ENCONTRADO em `getFinancialScore` (`journey.ts:126-158`) — só orçamento/categorização |
| Missões usam `spending_type` | NÃO ENCONTRADO — missões: importar / categorizar / orçamento / ver relatório (`journey.ts:33-38`) |
| Detecção automática de impulso | NÃO ENCONTRADO classifier/auto-tag; só marcação manual |
| `getMindfulInsights` na UI | definido em `mindful-insights.ts:19`; NÃO ENCONTRADO import em outros arquivos de `src/` |

---

## E. INTEGRAÇÃO BANCÁRIA

| Termo | Em `src/` / deps de runtime |
|-------|------------------------------|
| pluggy | NÃO ENCONTRADO |
| belvo | NÃO ENCONTRADO |
| open finance / Open Finance | NÃO ENCONTRADO |
| conexão automática OFX/API bancária | NÃO ENCONTRADO (import CSV local em `/import`) |

**Tela Contas** (`accounts-page.tsx:250-253`) diz ao usuário:

> `Carteiras e bancos só para organização — sem conexão automática com instituições.`

Rota: menu “Contas” → `/reports` → índice = `AccountsPage` (`Layout.tsx:195`, `App.tsx:204-205`).

---

## F. FLUXO DE USO (sequência real)

| # | Etapa | Tela / botão | Arquivo |
|---|-------|--------------|---------|
| 1 | Cadastro / login | Login (e-mail/senha ou Google) | `Login.tsx`, `AuthContext.tsx` |
| 2 | Onboarding (se `onboarding_completed_at` nulo) | `FirstAccessOnboarding` | `App.tsx:293-306`, `FirstAccessOnboarding.tsx` |
| 3 | Dashboard | `/` — score, missões, risco | `Dashboard.tsx`, `App.tsx:175-187` |
| 4 | Nova transação | botão “Nova transação” → picker Receita/Despesa → drawer | `Layout.tsx:266`, `App.tsx:219-254`, `TransactionDrawer.tsx` |
| 5 | Importar extrato | menu Importar → `/import` → CSV → preview → confirmar | `ImportPage.tsx`, `ImportPreviewPage.tsx` |
| 6 | Contas fixas | `/fixed-expenses` | `FixedExpenses.tsx` |
| 7 | Orçamento | `/budgets` → Novo Orçamento | `budgets-page.tsx` |
| 8 | Preparar mês | card Planejamento → **Preparar mês** | `MonthlyPlan.tsx:47` |
| 9 | Confirmar / vincular | Transações → quitar (✓) ou Vincular | `Transactions.tsx:674-751` |
| 10 | Análise de comportamento | Contas → aba Análise `/reports/analise` | `reports-page.tsx`, `App.tsx:205` |
| 11 | Contas (carteiras manuais) | Contas `/reports` | `accounts-page.tsx` |
| 12 | Perfil / Configurações | `/profile`, `/settings` | `profile-page.tsx`, `settings-page.tsx` |
| — | Ajuda contextual | botão flutuante Flux.ia | `FluxiaButton.tsx`, `FluxiaDrawer.tsx` |

---

## G. CPF

| Pergunta | Fato |
|----------|------|
| Obrigatório no signup e-mail? | **Sim** — input `required` (`Login.tsx:312`); `validateCpf` bloqueia (`85-87`); erro `CPF inválido.` |
| Obrigatório no Google? | **Não no formulário** — `signInWithGoogle` sem CPF (`AuthContext.tsx:68`); DB aceita default `''` (`001_identity.sql:4`) |
| Usado para quê? | Armazenado em `public.users.cpf`; gravado pós-verificação de e-mail via `sessionStorage` (`AuthContext.tsx:46-51`, `69-71`). NÃO ENCONTRADO uso em Open Finance, score, orçamento, RPC financeira ou Flux.ia |
| Onde aparece? | Cadastro (`Login.tsx:302-313`); Perfil campo desabilitado mascarado (`profile-page.tsx:70`, `200`) |

---

## Resumo executivo

- Flux.ia = roteador local keyword/regex; **sem Neon**; 19 frases testadas via `npx tsx -e`.
- Orçamento: barra no client (80/100); overflow = `floor(remaining/dailyAvg)`; caso 900/576,30/10-nov → **5 dias**, **R$ 16,19/dia**.
- Vincular: só previsão pendente com `planning_item_id` → RPC `link_planned_transaction`.
- Mindful: marcação **manual**; relatórios sim; score/missões/auto-impulso **não**.
- Open Finance / Pluggy / Belvo: **ausentes**; Contas avisa “sem conexão automática”.
- CPF: obrigatório no cadastro e-mail; espelho no perfil; sem uso financeiro além do armazenamento.
