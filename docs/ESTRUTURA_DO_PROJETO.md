> Documento histórico adaptado para Neon. Para configuração vigente, consulte README.md e neon/migrations; números de migrations e instruções de buckets anteriores são históricos.

# Estrutura do Projeto Fluxo

## Visão geral

```
Fluxo/
├── public/                 # Arquivos estáticos (servidos na raiz)
│   ├── fluxo-icon.png      # Logo (PNG)
│   └── fluxo-icon.svg      # Logo (SVG, usado como favicon)
├── src/
│   ├── app/                # Aplicação principal
│   │   ├── App.tsx         # Componente raiz e rotas
│   │   ├── pages/          # Páginas por rota (Orçamentos, Perfil, Config, Relatórios)
│   │   └── components/     # Componentes da aplicação
│   │       ├── Dashboard.tsx
│   │       ├── FluxoBrand.tsx   # Logo + nome animado
│   │       ├── Layout.tsx       # Sidebar e layout
│   │       ├── Login.tsx        # Tela de login/cadastro
│   │       ├── Pages.tsx        # Budgets, Settings, Reports
│   │       ├── TransactionDrawer.tsx
│   │       ├── Transactions.tsx
│   │       ├── ThemeProvider.tsx
│   │       ├── ui.tsx           # Componentes base (Button, Input, Card, etc.)
│   │       └── ui/              # Componentes shadcn/ui (primitivos)
│   ├── config/             # Configurações
│   │   └── neon.ts     # Credenciais do Neon
│   ├── contexts/
│   │   └── AuthContext.tsx # Estado de autenticação
│   ├── hooks/
│   │   ├── useBudgets.ts
│   │   ├── useTransactions.ts
│   │   ├── useFinancialProfile.ts
│   │   ├── useFixedExpenses.ts
│   │   └── useForecast.ts
│   ├── lib/                # Utilitários e serviços
│   │   ├── neon.ts     # Cliente Neon
│   │   ├── category-icons.tsx
│   │   ├── transaction-utils.ts
│   │   ├── forecast.ts     # Cálculo de previsão e risco
│   │   └── validation.ts
│   ├── styles/             # CSS global
│   ├── types/
│   │   └── database.ts     # Tipos e constantes
│   └── main.tsx
├── neon/
│   ├── migrations/         # Migrations SQL
│   └── functions/          # Edge Functions
├── docs/                   # Documentação
└── guidelines/             # Diretrizes do projeto
```

## Descrição das pastas

| Pasta | Descrição |
|-------|-----------|
| **public/** | Arquivos servidos diretamente. Ícones e assets devem ficar aqui. |
| **src/app/** | Componentes e páginas da aplicação. |
| **src/app/components/ui/** | Componentes shadcn/ui (accordion, dialog, etc.). |
| **src/config/** | Configurações (Neon, env). |
| **src/contexts/** | Contextos React (auth). |
| **src/hooks/** | Hooks customizados (transações, orçamentos). |
| **src/lib/** | Utilitários, cliente Neon, validações. |
| **src/types/** | Definições TypeScript. |
| **neon/migrations/** | SQL para criar tabelas. Execute no SQL Editor do Neon (schema atual em neon/migrations). |

## Ícones e assets

- **fluxo-icon.svg** e **fluxo-icon.png** em `public/` — versões do logo.
- O favicon usa `fluxo-icon.svg`.
- Para trocar o ícone: substitua os arquivos em `public/` e faça hard refresh (Ctrl+Shift+R).
