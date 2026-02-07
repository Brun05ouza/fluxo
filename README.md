# Fluxo - Controle Financeiro

Aplicação de controle financeiro com autenticação Supabase, transações e orçamentos.

## Estrutura do projeto

Veja [docs/ESTRUTURA_DO_PROJETO.md](docs/ESTRUTURA_DO_PROJETO.md) para a organização das pastas.

## Executar

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Autenticação (Supabase)

O projeto usa Supabase Auth para login e cadastro de usuários. As credenciais padrão estão em `src/config/supabase.ts`. Para usar outro projeto Supabase, crie um arquivo `.env` com:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

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