# Fluxo - Controle Financeiro

Aplicação de controle financeiro com autenticação Supabase, transações e orçamentos.

## Estrutura do projeto

Veja [docs/ESTRUTURA_DO_PROJETO.md](docs/ESTRUTURA_DO_PROJETO.md) para a organização das pastas.

## Executar

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Autenticação (Supabase)

O projeto usa Supabase Auth. O Vite lê **`VITE_SUPABASE_URL`** e **`VITE_SUPABASE_ANON_KEY`** do arquivo **`.env`** na raiz. Se não existir `.env`, usa o fallback em `src/config/supabase.ts`.

### Erro `ERR_NAME_NOT_RESOLVED` / `Failed to fetch` no login

O navegador não consegue resolver o host do Supabase (DNS). Causas comuns:

1. **Você usa Supabase local (`supabase start`)** mas o app ainda aponta para a nuvem — crie `.env` com a API local:
   ```bash
   npx supabase status
   ```
   Copie **API URL** (ex.: `http://127.0.0.1:54321`) e **anon key** para `.env` (veja `.env.example`) e **reinicie** `npm run dev`.

2. **Projeto na nuvem removido, pausado ou URL errada** — abra [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto → **Settings → API** e coloque **Project URL** e **anon public** no `.env`.

3. **Rede / firewall / DNS** bloqueando `*.supabase.co`.

Sempre que alterar `.env`, pare e suba de novo o `npm run dev`.

### Credenciais no `.env` (nuvem ou local)

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

Para desenvolvimento local com CLI, use a URL e a chave mostradas por `supabase status` (não o fallback do repositório).

### Configuração no Supabase Dashboard

1. Em **Authentication** → **Providers**, confirme que **Email** está habilitado.
2. Em **Authentication** → **URL Configuration**, adicione sua URL de produção (e `http://localhost:5173` para desenvolvimento) em **Redirect URLs**.
3. Para desativar a confirmação de e-mail (útil em desenvolvimento): **Authentication** → **Providers** → **Email** → desmarque "Confirm email".
4. **Erro "email rate limit exceeded" (429)?** O Supabase limita o envio de e-mails. Solução: desative "Confirm email" no passo 3 — assim o cadastro não envia e-mail e não atinge o limite. Ou aguarde ~1h para o limite resetar.

### Banco de dados

1. No Supabase Dashboard, vá em **SQL Editor**.
2. Execute em ordem:
   - `supabase/migrations/001_initial.sql` — tabelas `transactions` e `budgets`
   - `supabase/migrations/002_users_table.sql` — tabela `users` (nome, CPF, email) com sync automático do cadastro. A senha permanece criptografada em `auth.users`.
   - `supabase/migrations/006_onboarding.sql` — colunas `onboarding_completed_at` e `onboarding_data` em `financial_profile` (primeiro acesso no app). Quem já tinha perfil recebe a data automaticamente e não passa pelo wizard de novo.