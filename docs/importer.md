> Documento histórico adaptado para Neon. Para configuração vigente, consulte README.md e neon/migrations; números de migrations e instruções de buckets anteriores são históricos.

# Importação de Extrato — Fluxo

## Rotas

- `/import` — Upload do arquivo
- `/import/preview` — Revisão antes de salvar

## Formato CSV suportado

O parser detecta automaticamente:

- **Separador:** `,` `;` ou `\t`
- **Headers comuns:** data/date, descrição/description/histórico, valor/amount

### Exemplo de CSV

```csv
Data,Descrição,Valor
2025-01-15,Supermercado,-150.50
2025-01-16,PIX recebido,200.00
```

ou com ponto e vírgula:

```csv
Data;Histórico;Valor
15/01/2025;UBER;-25.90
```

## Fluxo

1. **Upload** — Arraste ou selecione arquivo .csv
2. **Parse** — Detecta separador e colunas
3. **Mapeamento** — Se não reconhecer, abre modal para mapear manualmente
4. **Normalização** — Converte datas para YYYY-MM-DD, valores para number
5. **Categorização** — Sugestão por keywords (UBER, IFOOD, NETFLIX, etc.)
6. **Deduplicação** — Consulta banco por range de datas e marca duplicados
7. **Preview** — Usuário revisa, altera categorias, filtra
8. **Commit** — Insere via `addTransactions` (bulk)

## Deduplicação

- Compara: data + valor + descrição normalizada
- Normalização: uppercase, remove números longos, caracteres especiais
- Uma query por range (minDate..maxDate) no Neon
- Duplicadas marcadas e por padrão não importadas (toggle disponível)

## Categorização

- Rule-based por keywords
- Fallback: "Outros"
- category_rules (aprendizado) — implementar em fase futura
