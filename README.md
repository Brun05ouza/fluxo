# Fluxo

Aplicação React/Vite de controle financeiro com banco PostgreSQL, autenticação e Data API no Neon.

## Desenvolvimento

```powershell
npm install
neon deploy
npm run neon:env
npm run db:migrate
npm run dev
```

O projeto está vinculado ao Neon `still-bonus-27942135`, branch `production`, região São Paulo. A configuração de serviços fica em `neon.ts`. O frontend é servido pelo Vite e pode ser hospedado na Vercel.

## Ambiente

`neon deploy` grava as variáveis em `.env.local`. `npm run neon:env` cria os aliases públicos usados pelo Vite:

- `VITE_NEON_AUTH_URL`: URL do Neon Auth.
- `VITE_NEON_DATA_API_URL`: URL da Data API.
- `DATABASE_URL_UNPOOLED`: conexão privada para migrations e scripts administrativos.

Nunca coloque a conexão PostgreSQL ou credenciais administrativas em variáveis `VITE_*`. Na hospedagem, configure apenas as duas URLs públicas para o frontend e registre o domínio no Neon Auth.

## Banco e permissões

As migrations versionadas ficam em `neon/migrations`. O script `scripts/migrate.mjs` aplica cada arquivo uma vez, em transação, verificando seu checksum. Valide alterações numa branch de teste antes de produção.

A Data API aplica RLS: cada usuário acessa somente seus registros. `is_admin` não pode ser modificado pelo navegador. As funções administrativas verificam a permissão no banco. A restauração de dados financeiros é transacional e preserva a identidade e a permissão administrativa.

Os hooks atualizam após gravações, entre abas, ao voltar para a janela e a cada 30 segundos enquanto a página está visível.

## Arquivos

Avatares (até 1 MB) e anexos (até 5 MB) são armazenados na tabela `files`, protegida por RLS, e referenciados como `neon-file:UUID`. Esse caminho foi adotado porque Object Storage não está disponível na região do projeto. Arquivos são carregados como blobs autenticados.

## Contas migradas

Os usuários existentes mantêm seus IDs, perfis e dados financeiros. As senhas antigas não puderam ser exportadas/importadas. No primeiro acesso, use **Recupere seu acesso**, informe o e-mail, receba o código e defina uma nova senha.

Quando a confirmação de e-mail está habilitada no Neon, novos cadastros confirmam por código. A configuração existente do projeto foi preservada. Login com Google usa o provedor configurado no Neon Auth.

## Verificação

```powershell
npm run build
npm test
node --env-file=.env.local scripts/verify-neon.mjs
```

O último comando cria uma conta temporária, verifica autenticação, sessão, CRUD, arquivos e isolamento de dados, e a remove ao terminar. A entrega real de e-mails e o consentimento Google precisam ser conferidos com a conta do usuário.

## Backup e importação

Os scripts de exportação/importação são administrativos. Credenciais da origem ficam em `.env.migration.local`, e os backups em `.migration-backup/`; ambos são ignorados pelo Git. A importação inicial exige Neon Auth vazio e impede reimportação do mesmo backup. O banco de origem foi mantido para recuperação.

## Planejamento mensal

A renda configurada é líquida. Use Preparar mês no Dashboard, Transações, Contas fixas ou Orçamentos: a renda principal, rendas extras e contas ativas geram lançamentos pendentes ligados à competência do mês. O botão é idempotente, inclusive para previsões excluídas. Os vencimentos são limitados ao último dia válido do mês.

Confirme o recebimento/pagamento em Transações. O saldo real considera a confirmação e a data efetiva. Se já existe um lançamento, use Vincular lançamento existente no menu da previsão; a operação preserva valor/status reais e remove a previsão. Editar configurações afeta os próximos meses preparados; previsões existentes podem ser editadas em Transações.

Orçamentos são limites por categoria, não despesas. O gasto realizado é mensal, exclui pendentes/ignorados, transferências e pagamentos de fatura (para não repetir a compra). Previsões pendentes reservam o disponível, e contas mensais não são extrapoladas como gastos diários.

Depois de novas migrations, execute neon data-api refresh-schema --database neondb.

Teste de integração: node --env-file=.env.local scripts/verify-monthly-plan.mjs. Cria e remove uma conta temporária; valida renda extra, idempotência, fevereiro, vínculo com salário recebido e restauração.
