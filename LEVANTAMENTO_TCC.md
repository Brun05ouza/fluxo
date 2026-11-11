# LEVANTAMENTO_TCC — fatos com evidência

Gerado em: 2026-10-27. Modo somente leitura (único arquivo criado: este).

---

## 0. Estado do repositório

- Branch: `main`
- HEAD: `a08b61971a204c58d186cf2f9ba32f9305569752`
- Data HEAD: `2026-10-16 10:25:11 -0300`
- Assunto HEAD: `fix(auth): clarify login errors and handle authentication failures`
- Remote: `origin https://github.com/Brun05ouza/fluxo` (fetch/push)
- Público: sim — página `https://github.com/Brun05ouza/fluxo` acessível sem login (0 stars / 0 forks)
- Base pedida: `0d3897f898f30945e472f9c085b7b5f30f69a786` (`2026-10-13 18:25:29 -0300`, `docs: add complete project documentation and TCC foundation`)
- Commits desde `0d3897f`: **2**

### Commits `0d3897f..HEAD`

| Hash (curto) | Data | Assunto | Arquivos | +/- |
|---|---|---|---|---|
| `1f16500` | 2026-10-16 10:18:44 -0300 | feat(ui): compact monthly planning summary on dashboard | `Dashboard.tsx`, `MonthlyPlan.tsx` | +28 / −4 |
| `a08b619` | 2026-10-16 10:25:11 -0300 | fix(auth): clarify login errors and handle authentication failures | `Login.tsx`, `authErrors.ts`, `authErrors.test.ts` | +49 / −9 |

`git diff --stat 0d3897f..HEAD`: 5 arquivos, +77 / −13.

---

## 1. O que mudou desde 0d3897f

1. `1f16500` — **alterada** UI do planejamento mensal no Dashboard: resumo compacto + dialog “Ver detalhes” (`MonthlyPlan.tsx`; uso em `Dashboard.tsx:557`).
2. `a08b619` — **alterada** autenticação: mensagens de erro mais claras; **adicionados** testes unitários de `mapAuthError` (`authErrors.ts`, `authErrors.test.ts`, `Login.tsx`).

---

## 2. Funcionalidades atuais (requisitos)

### Completas (usuário consegue usar hoje)

| Nome | Rota/tela | Faz | Código |
|---|---|---|---|
| Login e-mail/senha | Login (sem rota; `!user`) | Entrar, criar conta, recuperar senha, Google | `Login.tsx:28+`, `App.tsx:291` |
| Confirmação / OTP | AuthCodeForm | Verificar e-mail / nova senha | `AuthCodeForm.tsx:37` |
| Onboarding 1º acesso | overlay pós-login | Renda, extras, contas fixas, orçamentos | `FirstAccessOnboarding.tsx`, gate `App.tsx:293-306` |
| Dashboard / visão do mês | `/` | KPIs, score, missões, categorias, últimas txs, plano compacto | `Dashboard.tsx:526`, `App.tsx:175-188` |
| Preparar mês (planejamento) | Dashboard / Contas fixas / Orçamentos | RPC cria previsões pendentes | `MonthlyPlan.tsx:30-39`, RPC `005_monthly_planning.sql:17` |
| Transações (CRUD, filtros, quitação) | `/transactions` | Listar/buscar/filtrar; marcar pago; editar | `Transactions.tsx:320`, `App.tsx:189` |
| Vincular previsão ↔ lançamento | `/transactions` (dialog) | Substitui previsão por tx existente | `Transactions.tsx:706-751`, RPC `005:58` |
| Nova transação (drawer) | global | Receita/despesa, recorrência, anexo, tipo gasto | `TransactionDrawer.tsx`, `App.tsx:213-218` |
| Importar CSV | `/import` → `/import/preview` | Upload, preview, dedupe, commit | `ImportPage.tsx:71`, `pipeline.ts:22`, `ImportPreviewPage.tsx:166` |
| Contas fixas | `/fixed-expenses` | CRUD obrigações mensais | `FixedExpenses.tsx:98`, `App.tsx:192` |
| Orçamentos por categoria | `/budgets` | Limites, uso, alertas forecast | `budgets-page.tsx:186`, `forecast.ts` |
| Contas (carteiras) | `/reports` (aba Contas) | CRUD contas, saldo, incluir no total | `accounts-page.tsx:250`, `App.tsx:204` |
| Análise / relatórios | `/reports/analise` | Gastos, comportamento E/O/E | `reports-page.tsx:121`, `App.tsx:205` |
| Perfil | `/profile` | Dados, renda, pay_day, avatar | `profile-page.tsx:171`, `App.tsx:208` |
| Configurações | `/settings` | Tema, moeda UI, restaurar conta | `settings-page.tsx:129`, `App.tsx:209` |
| Flux.ia (assistente local) | drawer | Intents + tours | `FluxiaDrawer.tsx`, `intentRouter.ts` |
| Admin (só `is_admin`) | `/admin*` | Listar users, toggle admin | `App.tsx:309-311`, `AdminPage.tsx` |

### Parciais

| Nome | O que existe | O que falta | Evidência |
|---|---|---|---|
| **OFX** | Dropzone aceita `.ofx`; UI cita OFX; `parseOfx` exportado | Pipeline rejeita não-CSV; parser retorna `[]` | `ImportDropzone.tsx:5,87`; `pipeline.ts:26-27` (“Por enquanto só aceitamos CSV.”); `ofx.ts:3-5` |
| **Cartões / faturas** | Tabelas + repository + hooks; tipo `CREDIT_CARD` em Contas (limite) | Hooks `useCreditCards` / `useCreditCardInvoices` **não importados por nenhuma tela**; sem UI de fatura/itens | schema `002_finance.sql:183+`; hooks em `src/hooks/`; grep uso só nos próprios arquivos |
| Intent Flux.ia `CONTAS` | Texto + `openPage: '/accounts'` | Rota real é `/reports` (não `/accounts`) | `intentRouter.ts:184`; rotas `App.tsx:194-207` |

---

## 3. Banco de dados completo (DER)

Estado final = migrations `001`→`006` em `neon/migrations/`.  
Schema `neon_auth.*` (ex.: `neon_auth."user"`) é do Neon Auth — **não definido** nas migrations do projeto; só referenciado (`001_identity.sql:2`).

### Tabelas `public`

#### `users` — PK `id` → `neon_auth."user"(id)` ON DELETE CASCADE
- `id` UUID PK
- `nome` TEXT NOT NULL DEFAULT `''`
- `cpf` TEXT NOT NULL DEFAULT `''`
- `email` TEXT NOT NULL UNIQUE
- `avatar_url` TEXT
- `created_at` / `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `last_sign_in` TIMESTAMPTZ  
Evidência: `001_identity.sql:1-10`

#### `financial_profile` — PK `id` → `users(id)` CASCADE
- `id` UUID PK
- `monthly_income` DECIMAL(12,2) DEFAULT 0
- `pay_day` INT DEFAULT 1 CHECK (1..31)
- `created_at` / `updated_at` TIMESTAMPTZ
- `onboarding_completed_at` TIMESTAMPTZ
- `onboarding_data` JSONB
- `is_admin` BOOLEAN NOT NULL DEFAULT false  
Evidência: `002:40-46,78-80`; `003:1`

#### `transactions` — PK `id`; FK `user_id` → `users`
- `id` UUID PK DEFAULT gen_random_uuid()
- `user_id` UUID NOT NULL → users CASCADE
- `title` TEXT NOT NULL
- `description` TEXT
- `category` TEXT NOT NULL
- `amount` DECIMAL(12,2) NOT NULL
- `date` DATE NOT NULL
- `payment_method` TEXT NOT NULL
- `tags` TEXT[] DEFAULT `{}`
- `is_recurring` BOOLEAN DEFAULT false
- `created_at` TIMESTAMPTZ DEFAULT now()
- `spending_type` TEXT CHECK NULL|'ESSENTIAL'|'OPTIONAL'|'EMOTIONAL'
- `is_paid` BOOLEAN NOT NULL DEFAULT true
- `is_ignored` BOOLEAN NOT NULL DEFAULT false
- `recurring_count` INTEGER
- `recurring_interval` TEXT CHECK NULL|'MONTH'|'WEEK'
- `account_id` UUID → accounts SET NULL
- `credit_card_id` UUID → credit_cards SET NULL
- `credit_card_invoice_id` UUID → credit_card_invoices SET NULL
- `invoice_item_id` UUID → credit_card_invoice_items SET NULL
- `competency_date` DATE
- `effective_date` DATE
- `transaction_kind` TEXT NOT NULL DEFAULT 'expense' CHECK ('income'|'expense'|'transfer'|'invoice_payment'|'adjustment')
- `origin` TEXT NOT NULL DEFAULT 'manual' CHECK ('manual'|'automatic'|'imported'|'recurring')
- `settlement_status` TEXT NOT NULL DEFAULT 'settled' CHECK ('pending'|'settled'|'ignored')
- `destination_account_id` UUID → accounts SET NULL
- `attachment_url` TEXT
- `planning_item_id` UUID → monthly_plan_items SET NULL; UNIQUE parcial WHERE NOT NULL  
Evidência: `002:2-14` + alters; `005:14-15`

#### `budgets` — PK `id`; UNIQUE(`user_id`,`category`); FK `user_id` → users
- `id`, `user_id`, `category`, `limit_amount` DECIMAL(12,2), `created_at`  
`002:17-24`

#### `fixed_expenses` — PK `id`; FK `user_id` → users
- `id`, `user_id`, `title`, `amount`, `due_day` CHECK 1..31, `category`, `is_active` DEFAULT true, `created_at`  
`002:49-58`

#### `accounts` — PK `id`; FK `user_id` → users
- `id`, `user_id`, `name`, `institution_key` DEFAULT 'custom'
- `account_type` CHECK: CHECKING|CASH|SAVINGS|INVESTMENT|MEAL_VOUCHER|OTHER|CREDIT_CARD
- `color`, `initial_balance`, `credit_limit`, `include_in_home_total`, `created_at`, `updated_at`  
`002:107-122,144-154`

#### `credit_cards` — PK `id`; FK `user_id` → users; `payment_account_id` → accounts SET NULL
- `name`, `brand`, `bank_name`, `color`, `limit_total`, `closing_day`/`due_day` CHECK 1..31, `is_automatic`, `is_active`, timestamps  
`002:183-199`

#### `credit_card_invoices` — PK `id`; FK `user_id`, `credit_card_id` → credit_cards CASCADE
- UNIQUE índice (`credit_card_id`,`reference_month`)
- `reference_month`, `closing_date`, `due_date`, `amount_total`, `amount_paid`
- `status` CHECK open|closed|paid|partial|late; `paid_at`; timestamps  
`002:223-254`

#### `credit_card_invoice_items` — PK `id`; FKs user, card, invoice CASCADE; `transaction_id` → transactions SET NULL
- `description`, `amount` CHECK >0, `purchase_date`, `installment_number/total` ≥1
- `status` CHECK active|cancelled|ignored  
`002:258-297`

#### `files` — PK `id`; FK `user_id` → users
- `kind` CHECK avatar|attachment
- `name` length 1..255
- `content_type` CHECK jpeg/png/gif/webp/pdf/plain/csv
- `content_base64` + CHECKs tamanho (5MB; avatar ≤1MB image)  
`003_security_and_files.sql:3-13`

#### `monthly_plan_items` — PK `id`; FK `user_id` → users; `transaction_id` → transactions SET NULL
- `month` DATE CHECK day=1
- `source_key` TEXT NOT NULL
- UNIQUE(`user_id`,`month`,`source_key`); UNIQUE(`transaction_id`)  
`005_monthly_planning.sql:1-9`

### Funções RPC relevantes (não tabelas)
- `prepare_financial_month(DATE) → INTEGER` — `005:17-56`
- `link_planned_transaction(UUID,UUID)` — `005:58-75`
- `restore_financial_data()` — `005:88-103` (substitui `003:93`)
- `admin_get_users()`, `admin_set_user_admin` — `003:70-91`
- `session_user_id()` — `006:3-5` (substitui `auth.user_id()` nas RPCs)

### Mermaid erDiagram

```mermaid
erDiagram
  NEON_AUTH_USER ||--|| USERS : "id PK/FK"
  USERS ||--|| FINANCIAL_PROFILE : "id"
  USERS ||--o{ TRANSACTIONS : "user_id"
  USERS ||--o{ BUDGETS : "user_id"
  USERS ||--o{ FIXED_EXPENSES : "user_id"
  USERS ||--o{ ACCOUNTS : "user_id"
  USERS ||--o{ CREDIT_CARDS : "user_id"
  USERS ||--o{ CREDIT_CARD_INVOICES : "user_id"
  USERS ||--o{ CREDIT_CARD_INVOICE_ITEMS : "user_id"
  USERS ||--o{ FILES : "user_id"
  USERS ||--o{ MONTHLY_PLAN_ITEMS : "user_id"

  ACCOUNTS ||--o{ TRANSACTIONS : "account_id"
  ACCOUNTS ||--o{ TRANSACTIONS : "destination_account_id"
  ACCOUNTS ||--o{ CREDIT_CARDS : "payment_account_id"

  CREDIT_CARDS ||--o{ CREDIT_CARD_INVOICES : "credit_card_id"
  CREDIT_CARDS ||--o{ CREDIT_CARD_INVOICE_ITEMS : "credit_card_id"
  CREDIT_CARDS ||--o{ TRANSACTIONS : "credit_card_id"

  CREDIT_CARD_INVOICES ||--o{ CREDIT_CARD_INVOICE_ITEMS : "invoice_id"
  CREDIT_CARD_INVOICES ||--o{ TRANSACTIONS : "credit_card_invoice_id"

  CREDIT_CARD_INVOICE_ITEMS |o--o| TRANSACTIONS : "transaction_id / invoice_item_id"

  MONTHLY_PLAN_ITEMS |o--o| TRANSACTIONS : "transaction_id / planning_item_id"

  USERS {
    uuid id PK
    text nome
    text cpf
    text email UK
    text avatar_url
    timestamptz created_at
    timestamptz updated_at
    timestamptz last_sign_in
  }

  FINANCIAL_PROFILE {
    uuid id PK_FK
    decimal monthly_income
    int pay_day
    timestamptz onboarding_completed_at
    jsonb onboarding_data
    boolean is_admin
  }

  TRANSACTIONS {
    uuid id PK
    uuid user_id FK
    text title
    text category
    decimal amount
    date date
    text payment_method
    boolean is_paid
    boolean is_ignored
    text transaction_kind
    text origin
    text settlement_status
    date competency_date
    uuid account_id FK
    uuid planning_item_id FK
  }

  BUDGETS {
    uuid id PK
    uuid user_id FK
    text category
    decimal limit_amount
  }

  FIXED_EXPENSES {
    uuid id PK
    uuid user_id FK
    text title
    decimal amount
    int due_day
    text category
    boolean is_active
  }

  ACCOUNTS {
    uuid id PK
    uuid user_id FK
    text name
    text account_type
    decimal initial_balance
    decimal credit_limit
    boolean include_in_home_total
  }

  CREDIT_CARDS {
    uuid id PK
    uuid user_id FK
    text name
    decimal limit_total
    int closing_day
    int due_day
    uuid payment_account_id FK
  }

  CREDIT_CARD_INVOICES {
    uuid id PK
    uuid user_id FK
    uuid credit_card_id FK
    date reference_month
    text status
    decimal amount_total
    decimal amount_paid
  }

  CREDIT_CARD_INVOICE_ITEMS {
    uuid id PK
    uuid invoice_id FK
    uuid credit_card_id FK
    uuid transaction_id FK
    decimal amount
    date purchase_date
  }

  FILES {
    uuid id PK
    uuid user_id FK
    text kind
    text name
    text content_type
  }

  MONTHLY_PLAN_ITEMS {
    uuid id PK
    uuid user_id FK
    date month
    text source_key
    uuid transaction_id FK
  }
```

---

## 4. Fluxos das funções de planejamento

Fonte: `neon/migrations/005_monthly_planning.sql` (identidade via `session_user_id` após `006`).

### `prepare_financial_month(target_month DATE) → INTEGER`

1. `uid := auth.user_id()::uuid` (pós-006: `session_user_id()::text` nas defs).
2. Se `uid IS NULL` → **erro** `'Não autenticado'` (ERRCODE 42501). `005:23`
3. Se `target_month IS NULL` → **erro** `'Selecione um mês'`. `005:24`
4. `first_day := date_trunc('month', target_month)::date`; calcula `last_day` do mês. `005:25-26`
5. `pg_advisory_xact_lock(hashtext(uid || first_day))`. `005:27`
6. SELECT `financial_profile` do uid; se NOT FOUND → **erro** `'Configure sua renda e suas contas antes de preparar o mês'`. `005:28-29`
7. Lê `onboarding_data->'extraIncomes'` (array; senão `[]`); soma `extra_total`. `005:30-32`
8. Monta fontes (loop):
   - `salary`: título “Salário previsto”, categoria “Salário”, amount = `GREATEST(monthly_income - extra_total, 0)`, due = pay_day
   - `extra:{label}`: rendas extras com amount > 0
   - `fixed:{id}`: fixed_expenses ativas, amount negativo  
   `005:33-41`
9. Para cada fonte: se `amount = 0` → CONTINUE. `005:43`
10. INSERT `monthly_plan_items` ON CONFLICT DO NOTHING RETURNING id. `005:44-45`
11. Se `item_id IS NULL` (já existia / conflito) → CONTINUE (não regenera). `005:46-47`
12. INSERT transaction previsão: `is_paid=false`, `origin='automatic'`, `settlement_status='pending'`, `planning_item_id`, payment_method `'Transferência'`, date = first_day + LEAST(due_day,last_day)-1, competency = first_day. `005:48-51`
13. UPDATE plan item `transaction_id`; incrementa `created_count`. `005:52-53`
14. RETURN `created_count`. `005:55`

### `link_planned_transaction(plan_id UUID, existing_id UUID)`

1. Resolve `uid`; se NULL → **erro** `'Não autenticado'`. `005:63`
2. SELECT plan item `WHERE id=plan_id AND user_id=uid FOR UPDATE`; NOT FOUND → **erro** `'Previsão não encontrada'`. `005:64-65`
3. SELECT forecast `WHERE id=item.transaction_id AND user_id=uid FOR UPDATE`; se NOT FOUND **OU** `forecast.is_paid` **OU** `forecast.is_ignored` → **erro** `'Apenas previsões pendentes podem ser vinculadas'`. `005:66-67`
4. SELECT existing `WHERE id=existing_id AND user_id=uid FOR UPDATE`; falha se NOT FOUND **OU** mesmo id da forecast **OU** `existing.planning_item_id IS NOT NULL` **OU** `existing.is_ignored` **OU** mês competência ≠ `item.month` **OU** `sign(amount)` diferente → **erro** `'Escolha um lançamento do mesmo mês e tipo, ainda não vinculado'`. `005:68-71`
5. UPDATE plan: `transaction_id = existing.id`. `005:72`
6. DELETE forecast. `005:73`
7. UPDATE existing: `planning_item_id = item.id`. `005:74`

---

## 5. Flux.ia — o que existe de fato

Router: `src/fluxia/assistant/intentRouter.ts`. Sem LLM.

### Intenções

| Intent | Keywords / regex (resumo) | Resposta / ação |
|---|---|---|
| HELP (vazio) | input vazio | “Como posso te ajudar?” + sugestões `intentRouter.ts:248-252` |
| GREETING | `GREETING_RE` / `GREETING_SOFT_RE` `:188-192` | Saudação aleatória + sugestões; sem guide |
| THANKS | `THANKS_RE` `:194-195` | “Por nada!…” |
| FAREWELL | `FAREWELL_RE` `:197-198` | “Até logo!…” |
| HELP | `HELP_RE` `:200-201` | Lista capacidades + sugestões |
| IMPORT_EXTRATO | importar, extrato, csv, ofx, … `:14-28` | Texto importar; `hasGuide`; `openPage=/import` |
| NOVA_TRANSACAO | nova transacao, gasto, receita, … `:36-47` | Texto drawer; guide; `/` |
| CRIAR_ORCAMENTO | orcamento, limite, … `:55-64` | Texto; guide; `/budgets` |
| VER_RELATORIOS | relatorio, grafico, … `:72-87` | Texto Análise; guide; `/reports/analise` |
| GERENCIAR_CATEGORIAS | categoria, organizar, … `:95-101` | Texto; guide; sem openPage |
| CONFIGURACOES | config, tema, perfil, … `:108-118` | Texto; guide; `/settings` |
| ENTENDER_SCORE | score, pontuacao, … `:126-134` | Texto; guide; `/` |
| ENTENDER_RELATORIO | essencial/opcional/emocional, … `:142-149` | Texto; guide; `/reports/analise` |
| CONTAS_FIXAS | conta fixa, aluguel, … `:157-165` | Texto; **sem** guide; `/fixed-expenses` |
| CONTAS | minhas contas, cartao, … `:173-180` | Texto; **sem** guide; `openPage=/accounts` (rota inexistente) |
| UNKNOWN | fallback `:296-306` | “não entendi” + sugestões |

Ação com `hasGuide`: navega `openPage`, fecha drawer, `startTour(intent)` — `FluxiaDrawer.tsx:74-83`.

### Ações rápidas (`QUICK_ACTIONS`)

`FluxiaDrawer.tsx:18-24`:
1. Como importar extrato? → IMPORT_EXTRATO  
2. Onde estou gastando mais? → VER_RELATORIOS  
3. Como criar orçamento? → CRIAR_ORCAMENTO  
4. Adicionar gasto → NOVA_TRANSACAO  
5. Entender score → ENTENDER_SCORE  

### Guias / playbooks (`playbooks.ts:279-289`)

| Playbook | Rota inicial (1º step) | Passos (ids) |
|---|---|---|
| IMPORTAR_EXTRATO | `/import` | nav-importar → dropzone → help |
| NOVA_TRANSACAO | (drawer; sem route no 1º) | tx-type → valor → descricao → categoria → data → pagamento → mindful → recorrente → botoes |
| FILTRAR_TRANSACOES | `/transactions` | nav → search → filters |
| CRIAR_ORCAMENTO | `/budgets` | nav → new → form |
| CATEGORIAS | `/transactions` | nav → category-filter |
| VER_RELATORIOS | `/reports/analise` | nav → reports-page |
| CONFIGURACOES_TEMA | `/settings` | nav → theme |
| ENTENDER_SCORE | `/` | dashboard-score → suggestions |
| ENTENDER_RELATORIO | `/reports/analise` | nav → reports-page |

Aliases intent→playbook: `IMPORT_EXTRATO→IMPORTAR_EXTRATO`, `CONFIGURACOES→CONFIGURACOES_TEMA`, `GERENCIAR_CATEGORIAS→CATEGORIAS` (`playbooks.ts:292-296`).

### Chamada a modelo de IA?

- Busca em `src/`: `gemini`, `generativeai`, `openai`, `anthropic` → **NÃO ENCONTRADO** (matches irrelevantes: `installment`, `pillMuted`).
- `fetch(` em `src/`: só wrapper Data API em `neon.ts:16` + `refetch`/`fetch()` de hooks — **não** é LLM.
- Flux.ia = `detectIntent` local + delay fake digitando (`FluxiaDrawer.tsx:102-117`).

---

## 6. Importação

### Formatos aceitos de fato pelo pipeline
- **Só `.csv`** — `pipeline.ts:24-27`. Extensão ≠ `.csv` → erro `'Por enquanto só aceitamos CSV.'`
- Dropzone declara CSV e OFX (`ImportDropzone.tsx:5,87`) — UI ≠ pipeline.

### Parser OFX
- Stub: `parseOfx(_content) { return []; }` — `ofx.ts:3-5`
- Comentário “FASE 3” — `parsers/index.ts:1`

### Critérios de duplicata (`dedupe/index.ts:25-43`)
- Chave: `` `${date}|${amount}|${normalizeForCompare(description|title)}` ``
- `normalizeForCompare`: upper, colapsa espaços, remove dígitos longos (≥4), remove `*#-_.,;:`, só A-Z0-9 espaço, slice 60 (`:3-16`)
- Marca vs. txs existentes no intervalo de datas **e** vs. outras linhas do próprio arquivo (set cresce)

Outros erros pipeline: CSV inválido `:37`; nenhuma linha `:41`; sem colunas `:53`; sem txs após normalize `:59`.

---

## 7. Testes — como são executados

### Configuração
- Comando: `npm test` → `"vitest run"` (`package.json:9`)
- Watch: `npm run test:watch` → `vitest` (`:10`)
- **NÃO ENCONTRADO** `vitest.config.*` (procurado na raiz)
- `vite.config.ts` sem bloco `test` (`vite.config.ts:1-22`)
- Vitest resolve via defaults + alias `@` do Vite se deps instaladas

### Cada `it(`

#### `src/lib/authErrors.test.ts`
1. **explica bloqueio de origem…** — `mapAuthError(Invalid origin / INVALID_ORIGIN)` contém `'endereço ainda não está liberado'`  
2. **distingue credenciais…** — inputs: `Invalid email or password` → “E-mail ou senha incorretos”; `Email not verified` → “Confirme seu e-mail”; `OTP expired` → “código expirou”  
3. **não mostra erros internos…** — `Internal server error` não vaza; `TypeError Failed to fetch` → conectar; `As senhas não coincidem.` preservada  

#### `src/lib/financial-status.test.ts`
1. **salário previsto só conta…** — tx +3000 `pending` → income 0; `settled` → 3000  
2. **ignora despesas canceladas…** — mix ignored/pending/invoice_payment/transfer → expense total 100  
3. **orçamento mensal não inclui…** — out/2026 vs set/2026 → só 100  
4. **conta mensal não vira gasto diário…** — mês atual: −100 settled + −50 pending com planning_item; budget Casa 200 → spent 100, forecast 150  

#### `src/lib/forecast.test.ts` — `computeForecast`
1. **calcula dailyAvg e forecastEndMonth** — 3×−100 em fev/2025, budget 1000  
2. **riskLevel OK** — 2×−100, <80%  
3. **riskLevel WARNING** — 10×−85 (≥80%)  
4. **riskLevel DANGER** — −600 + −500 (≥100%)  
5. **suggestedDailyLimit** — −200 / budget 1000  

#### `getAlertMessageForCategory`
6. **null** se percent < 80 (50, 79)  
7. **mensagem** ≥80 <100 (83% + “Alimentação”)  
8. **estourado** se ≥100  

**Total: 15 `it(` em 3 arquivos.**

### Execução `npm test` e `npx tsc --noEmit`

Pré-condição observada: `node_modules` **ausente** (`Test-Path node_modules` = False). Não foi rodado `npm install` (modo somente leitura).

**Início `npm test`:** `2026-10-27 21:10:04 -03:00`

```
> fluxo@0.0.1 test
> vitest run

'vitest' não é reconhecido como um comando interno
ou externo, um programa operável ou um arquivo em lotes.
```

**Início `npx tsc --noEmit`:** `2026-10-27 21:10:17 -03:00`

```
                This is not the tsc command you are looking for               

To get access to the TypeScript compiler, tsc, from the command line either:

- Use npm install typescript to first add TypeScript to your project before using npx
- Use yarn to avoid accidentally running code from un-installed packages
```

**Fim:** `2026-10-27 21:10:25 -03:00`  
Exit code: 1 (ambos).

### Scripts `verify-*.mjs` (SEM executar)

#### `scripts/verify-neon.mjs`
- Pré-requisitos: `DATABASE_URL_UNPOOLED`, `NEON_AUTH_BASE_URL`, `NEON_DATA_API_URL` (lidos no script `:4-5`); README: `node --env-file=.env.local scripts/verify-neon.mjs` (`README.md:50`)
- Comando: `node --env-file=.env.local scripts/verify-neon.mjs`
- Verifica (ordem, logs PASS):
  1. Signup Neon Auth
  2. Sign-in
  3. Session restoration
  4. Anonymous access denied
  5. Isolamento (lista txs vazia para o user novo)
  6. CRUD profile + budget + transaction (insert/patch/delete)
  7. Escalada `is_admin` via PATCH negada
  8. RPC `admin_get_users` negada para não-admin
  9. Upload/download `files`
  10. Sign-out  
- Finally: apaga user temp em `neon_auth."user"`

#### `scripts/verify-monthly-plan.mjs`
- Pré-requisitos: mesmos env (`DATABASE_URL_UNPOOLED`, `NEON_AUTH_*`, `NEON_DATA_API_URL`); README `:69`
- Comando: `node --env-file=.env.local scripts/verify-monthly-plan.mjs`
- Verifica:
  1. `prepare` → 3 previsões (salário + extra + fixa)
  2. Repetir prepare → 0 (idempotência)
  3. Dia 31 em fev → 28; renda 3500 sem duplicar extras
  4. `link_planned_transaction` preserva valor real 2900 e remove previsão
  5. Após link, prepare ainda 0; após DELETE da previsão de despesa, prepare 0 (não reaparece)
  6. `restore_financial_data` zera `monthly_plan_items`  
- Finally: remove conta temporária

---

## 8. Telas (rota ↔ nome na UI)

| Rota | Nome na interface | Evidência |
|---|---|---|
| (não autenticado) | Bem-vindo / Criar conta / Recuperar senha | `Login.tsx:250-252` |
| OTP | Confirme seu e-mail / Defina sua nova senha | `AuthCodeForm.tsx:37` |
| Onboarding | títulos por fase (welcome + renda/contas/orçamentos) | `FirstAccessOnboarding.tsx:522-548,603` |
| `/` | Nav: **Dashboard**; h1: labels.visaoDoMes (“Visão do mês” via microcopy) | `Layout.tsx:190`; `Dashboard.tsx:526` |
| `/transactions` | **Transações** | `Transactions.tsx:320`; nav `Layout.tsx:191` |
| `/import` | **Importar extrato** (nav: Importar) | `ImportPage.tsx:71`; `Layout.tsx:192` |
| `/import/preview` | **Revisar importação** | `ImportPreviewPage.tsx:166` |
| `/fixed-expenses` | **Contas fixas** | `FixedExpenses.tsx:98` |
| `/budgets` | **Gerenciar Orçamentos** (nav: Orçamentos) | `budgets-page.tsx:186`; `Layout.tsx:194` |
| `/reports` | Nav **Contas**; aba Contas; h2 Contas | `Layout.tsx:195`; `reports-layout.tsx:36`; `accounts-page.tsx:250` |
| `/reports/analise` | Aba **Análise**; h2 Análise | `reports-layout.tsx:38-39`; `reports-page.tsx:121` |
| `/reports/contas` | redirect → `/reports` | `App.tsx:206` |
| `/profile` | **Meu Perfil** (header Layout) | `Layout.tsx:402`; `profile-page.tsx:171` |
| `/settings` | **Configurações** | `settings-page.tsx:129` |
| `/admin*` | **Fluxo Admin** / seções | `AdminPage.tsx:96,912`; gate `App.tsx:309` |
| `*` | Navigate → `/` | `App.tsx:210` |

Header topbar: usa label do menu ativo ou “Meu Perfil” em `/profile` (`Layout.tsx:401-403`).
