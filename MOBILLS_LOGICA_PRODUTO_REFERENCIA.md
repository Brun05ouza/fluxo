# MOBILLS_LOGICA_PRODUTO_REFERENCIA

## Resumo executivo

Este documento define a referencia funcional para evolucao do Fluxo como gerenciador financeiro pessoal robusto, usando a logica de produto inspirada em apps do tipo Mobills, sem copiar identidade visual, textos, marca ou layout proprietario.

Objetivo central: transformar o Fluxo em uma plataforma com dominio financeiro consistente, foco em transacao como evento central, suporte a planejamento e leitura rapida do cenario financeiro, com arquitetura escalavel.

---

## 1) Auditoria do projeto atual (estado real)

### 1.1 Estrutura atual

- **Frontend React + Vite** com rotas em `src/app/App.tsx`.
- **UI** baseada em componentes `src/app/components` e primitives em `src/app/components/ui`.
- **Persistencia direta** em hooks (`useTransactions`, `useAccounts`, `useBudgets`, etc.) chamando Neon.
- **Banco Neon** com migrations incrementais em `neon/migrations`.

### 1.2 Modulos existentes

- Autenticacao e perfil de usuario.
- Contas (`accounts`) com tipo incluindo `CREDIT_CARD`.
- Transacoes com `is_paid`, `is_ignored`, recorrencia e `account_id`.
- Orcamentos por categoria (`budgets`).
- Contas fixas (`fixed_expenses`).
- Importacao (CSV/OFX) com preview e dedupe.
- Dashboard e relatorios basicos.

### 1.3 Lacunas vs logica alvo

- Cartao ainda modelado como tipo de conta, nao como modulo separado com fatura/ciclo.
- Categoria/subcategoria/tag sem modelagem relacional completa.
- Regras criticas espalhadas entre UI e hooks (dominio pouco isolado).
- Sem modelo explicito para tipos de transacao: transferencia, pagamento de fatura, ajuste.
- Sem camada preparada para reconciliacao de integracoes automaticas (Open Finance futuro).

### 1.4 Gargalos de UX

- Boa base de usabilidade, mas com dependencias de regra dentro de componentes.
- Filtros e relatorios ainda limitados para cortes complexos (conta/cartao/tag/status/origem).
- Dashboard ainda sem personalizacao por ordem/visibilidade/prioridade de cards.

### 1.5 Gargalos de dados/escalabilidade

- Dominio dependente de strings livres (categoria e varios estados).
- Ausencia de entidades para fatura e itens de fatura.
- Falta de contratos de dominio centralizados para reduzir regressao ao escalar.

---

## 2) Principios funcionais do produto

1. **Transacao e o centro do sistema.**
2. **Separar origem do evento e impacto financeiro.** Ex.: compra no cartao nao e igual a pagamento de fatura.
3. **Caixa vs previsao** sempre explicitos.
4. **Rastreabilidade** (manual/automatica/importada/recorrente).
5. **Leitura rapida do cenario financeiro** (dashboard, alertas e relatorios).
6. **Arquitetura por dominio**, nao por acoplamento de tela.

---

## 3) Arquitetura funcional alvo

### 3.1 Camadas recomendadas

```text
src/features/finance/
  domain/
    entities/
    value-objects/
    rules/
    events/
  application/
    use-cases/
    services/
  infrastructure/
    repositories/neon/
    mappers/
    adapters/
  presentation/
    hooks/
    view-models/
    pages/
```

### 3.2 Contratos e fronteiras

- `domain`: regra pura, sem UI e sem Neon.
- `application`: orquestra regras e repositorios.
- `infrastructure`: implementa repositorios e integracoes.
- `presentation`: converte input de tela em comandos de dominio.

---

## 4) Mapeamento de entidades e relacoes (alvo)

## 4.1 Ja existe

- `users`, `financial_profile`, `accounts`, `transactions`, `budgets`, `fixed_expenses`.

## 4.2 Ajustar

- `transactions`: incluir tipo de transacao, origem, status operacional, data de competencia/efetiva.
- `accounts`: manter foco em conta de dinheiro real (conta corrente, carteira, poupanca etc.).

## 4.3 Criar do zero

- `credit_cards`
- `credit_card_invoices`
- `credit_card_invoice_items`
- `categories`
- `subcategories`
- `tags`
- `transaction_tags` (N:N)
- `goals` e `goal_deposits`
- `alerts`
- `integration_connections`, `sync_runs`, `reconciliation_items` (futuro automatico)

## 4.4 Melhoria futura

- Dashboard layouts por usuario (`dashboard_layouts`, `dashboard_widgets`).
- Modo de analise caixa/competencia por contexto de relatorio.

---

## 5) Regras de negocio obrigatorias

### 5.1 Contas

- Receita recebida aumenta saldo efetivo.
- Despesa paga reduz saldo efetivo.
- Pendente nao altera saldo efetivo, mas altera previsao.
- Transferencia cria dois movimentos espelhados:
  - saida conta origem
  - entrada conta destino

### 5.2 Transacoes

Campos minimos obrigatorios para operacao:
- valor
- data
- categoria
- conta
- status pago/recebido
- descricao opcional
- tags/anexos opcionais

### 5.3 Ignorar transacao

- Excluir de analiticos principais (orcamento, relatorios centrais, desempenho por categoria).
- Manter para espelhamento de extrato/fatura quando necessario.

### 5.4 Cartao e fatura (regra critica)

- Compra no cartao entra na fatura do ciclo.
- Pagamento da fatura gera saida real da conta pagadora.
- Relatorio deve suportar:
  - visao por compra
  - visao por pagamento (padrao consolidado de caixa)

### 5.5 Parcelamento

- Parcelas distribuidas em faturas futuras.
- Projecao de impacto futuro para planejamento e limite.

---

## 6) Fluxos principais

1. **Criar conta** -> saldo inicial -> aparece em seletores e consolidacao.
2. **Registrar despesa/receita** -> atualiza saldo/previsao conforme status.
3. **Registrar transferencia** -> cria par espelhado atomico.
4. **Registrar compra no cartao** -> vincula item a fatura.
5. **Fechar fatura** -> bloqueia alteracoes fora de politica permitida.
6. **Pagar fatura** -> gera `invoice_payment` na conta pagadora.
7. **Planejar mes** -> distribuir orcamento por categoria/subcategoria.
8. **Acompanhar metas** -> depositos manuais e progresso.

---

## 7) Estados das entidades

### 7.1 Transacao

- `pending`
- `paid` / `received`
- `ignored`

### 7.2 Fatura

- `open`
- `closed`
- `partial`
- `paid`
- `late`

### 7.3 Objetivo

- `active`
- `paused`
- `completed`

---

## 8) Filtros, calculos e eventos do sistema

### 8.1 Filtros essenciais

- periodo
- conta
- cartao
- categoria/subcategoria
- tag
- status
- origem
- ignoradas (incluir/excluir)
- pago/pendente

### 8.2 Calculos essenciais

- saldo efetivo
- saldo previsto
- limite disponivel do cartao
- valor de fatura (aberta/fechada)
- consumo de orcamento por categoria
- risco de extrapolacao
- progresso de metas

### 8.3 Eventos de dominio

- `transaction.created`
- `transaction.status_changed`
- `transfer.created`
- `invoice.closed`
- `invoice.paid`
- `budget.threshold_reached`
- `goal.deposit_added`

---

## 9) Jornadas de usuario (produto)

1. **Primeiros 10 minutos**
   - cadastro
   - onboarding financeiro
   - criar conta principal
   - criar 2-3 lancamentos

2. **Uso diario**
   - registrar gasto/receita rapido
   - revisar pendencias e vencimentos
   - ajustar categorias e tags

3. **Fechamento mensal**
   - revisar faturas
   - pagar faturas
   - checar orcamento e relatorios
   - ajustar metas

---

## 10) Proposta tecnica (implementacao)

## 10.1 Estrutura recomendada de codigo

```text
src/features/finance/
  domain/
    entities/transaction.ts
    entities/account.ts
    entities/credit-card.ts
    entities/invoice.ts
    rules/balance-engine.ts
    rules/invoice-engine.ts
  application/
    use-cases/create-transaction.ts
    use-cases/create-transfer.ts
    use-cases/pay-invoice.ts
  infrastructure/
    repositories/neon-transaction-repo.ts
    repositories/neon-account-repo.ts
    repositories/neon-credit-card-repo.ts
  presentation/
    hooks/use-transaction-actions.ts
    hooks/use-balance-projection.ts
```

## 10.2 Contratos centrais

- `TransactionKind = income | expense | transfer | invoice_payment | adjustment`
- `TransactionOrigin = manual | automatic | imported | recurring`
- `SettlementStatus = pending | settled | ignored`

## 10.3 Migracoes iniciais necessarias

- Ajustar `transactions` para incluir colunas de dominio faltantes.
- Criar tabelas de cartao/fatura/itens.
- Criar tabelas de categorias/subcategorias/tags.

---

## 11) UX/UI recomendada (logica, sem copia visual)

- Formulario de transacao curto + secao �mais detalhes�.
- Separar com clareza:
  - data da compra
  - data de pagamento
  - impacto no caixa
- Dashboard com cards configuraveis.
- Alertas acionaveis (nao so informativos).
- Relatorios com filtros persistentes por sessao.

---

## 12) Matriz de implementacao

## 12.1 Ja existe no projeto

- Autenticacao
- CRUD basico de transacoes
- CRUD basico de contas
- Orcamentos e dashboards iniciais
- Importacao com preview

## 12.2 Precisa ajustar

- Contratos/tipos do dominio de transacoes
- Regras de saldo/previsao isoladas da UI
- Estrutura de relatorios para filtros amplos

## 12.3 Precisa criar do zero

- Modulo completo de cartoes/faturas
- Subcategorias/tags relacionais
- Metas financeiras robustas
- Calendario financeiro completo
- Camada de sincronizacao automatica futura

## 12.4 Melhoria futura

- Open Finance provider framework
- Reconciliacao assistida
- Observabilidade de sincronizacao
- Personalizacao avancada de dashboard

---

## 13) Prioridades por fase

### Fase 0 � Documento e baseline (concluida neste ciclo)
- Consolidar arquitetura funcional e plano de execucao.

### Fase 1 � Core contas + transacoes (prioridade maxima)
- Tipos de transacao + engine de saldo/previsao.
- Transferencia espelhada.
- Ignorar transacao com impacto analitico controlado.

### Fase 2 � Cartoes + faturas
- Entidades, servicos e regras de fechamento/pagamento.

### Fase 3 � Planejamento + metas
- Orcamento por itens e objetivos manuais.

### Fase 4 � Relatorios + dashboard modular
- Filtros avancados e configuracao por usuario.

### Fase 5 � Exportacao/importacao avancada + integracoes
- Exportadores, normalizacao, reconciliacao e logs.

---

## 14) Decisoes de produto adotadas

- Priorizar **fluxo funcional** sobre est�tica.
- Priorizar **consistencia financeira** sobre simplificacao de modelagem.
- Priorizar **modularidade** para escalar sem reescrever.
- Manter compatibilidade progressiva com telas atuais durante a migracao.

---

## 15) Proximos passos executaveis imediatos

1. Definir contratos de dominio no codigo (`types + domain rules`).
2. Introduzir camada de use-cases para criacao/edicao de transacao.
3. Refatorar hooks para consumir servicos de dominio.
4. Preparar migrations de cartao/fatura sem quebrar operacao atual.
5. Evoluir UI de transacoes para suportar transferencia e status de caixa/previsao.

