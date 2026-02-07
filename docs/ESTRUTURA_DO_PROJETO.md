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
│   │   └── supabase.ts     # Credenciais do Supabase
│   ├── contexts/
│   │   └── AuthContext.tsx # Estado de autenticação
│   ├── hooks/
│   │   ├── useBudgets.ts
│   │   └── useTransactions.ts
│   ├── lib/                # Utilitários e serviços
│   │   ├── supabase.ts     # Cliente Supabase
│   │   ├── category-icons.tsx
│   │   ├── transaction-utils.ts
│   │   └── validation.ts
│   ├── styles/             # CSS global
│   ├── types/
│   │   └── database.ts     # Tipos e constantes
│   └── main.tsx
├── supabase/
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
| **src/config/** | Configurações (Supabase, env). |
| **src/contexts/** | Contextos React (auth). |
| **src/hooks/** | Hooks customizados (transações, orçamentos). |
| **src/lib/** | Utilitários, cliente Supabase, validações. |
| **src/types/** | Definições TypeScript. |
| **supabase/migrations/** | SQL para criar tabelas. Execute no SQL Editor do Supabase. |

## Ícones e assets

- **fluxo-icon.svg** e **fluxo-icon.png** em `public/` — versões do logo.
- O favicon usa `fluxo-icon.svg`.
- Para trocar o ícone: substitua os arquivos em `public/` e faça hard refresh (Ctrl+Shift+R).
