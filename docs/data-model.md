> Documento histórico adaptado para Neon. Para configuração vigente, consulte README.md e neon/migrations; números de migrations e instruções de buckets anteriores são históricos.

# Modelo de Dados — Fluxo

## Diagrama Lógico

```
neon_auth.user (Neon Auth)
    │
    ├── users (espelho: nome, cpf, email)
    ├── financial_profile (monthly_income, pay_day)
    ├── transactions (title, category, amount, date, ...)
    ├── budgets (category, limit_amount)
    └── fixed_expenses (title, amount, due_day, category)
```

## Tabelas

### transactions
| Coluna         | Tipo           | Descrição                          |
|----------------|----------------|------------------------------------|
| id             | UUID           | PK                                 |
| user_id        | UUID           | FK neon_auth.user                      |
| title          | TEXT           | Descrição da transação             |
| description    | TEXT           | Opcional                           |
| category       | TEXT           | Ex: Alimentação, Transporte        |
| amount         | DECIMAL(12,2)  | Positivo=receita, Negativo=despesa |
| date           | DATE           | Data da transação                  |
| payment_method | TEXT           | Cartão, Pix, etc.                  |
| tags           | TEXT[]         | Tags opcionais                     |
| is_recurring   | BOOLEAN        | Recorrente mensal                  |
| created_at     | TIMESTAMPTZ    |                                    |

### budgets
| Coluna       | Tipo           | Descrição              |
|--------------|----------------|------------------------|
| id           | UUID           | PK                     |
| user_id      | UUID           | FK neon_auth.user          |
| category     | TEXT           | Mesma lista de categories |
| limit_amount | DECIMAL(12,2)  | Limite mensal          |
| created_at   | TIMESTAMPTZ    |                        |

UNIQUE(user_id, category)

### financial_profile
| Coluna        | Tipo        | Descrição          |
|---------------|-------------|--------------------|
| id            | UUID        | PK = user_id       |
| monthly_income| DECIMAL     | Renda mensal       |
| pay_day       | INT         | Dia 1-31           |
| created_at    | TIMESTAMPTZ |                    |
| updated_at    | TIMESTAMPTZ |                    |

### fixed_expenses
| Coluna    | Tipo        | Descrição           |
|-----------|-------------|---------------------|
| id        | UUID        | PK                  |
| user_id   | UUID        | FK neon_auth.user       |
| title     | TEXT        | Nome da obrigação   |
| amount    | DECIMAL     | Valor               |
| due_day   | INT         | Dia 1-31            |
| category  | TEXT        | Categoria           |
| is_active | BOOLEAN     | Ativo/inativo       |
| created_at| TIMESTAMPTZ |                     |

## Categorias (CATEGORIES)

Alimentação, Transporte, Casa, Lazer, Saúde, Educação, Assinaturas, Trabalho, Extra, Outros
