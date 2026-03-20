/**
 * Formatação monetária em BRL para exibição na UI.
 */

export function formatCurrencyBRL(value: number): string {
  return (
    'R$ ' +
    value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

/** Valor absoluto (ex.: linhas de importação onde o sinal é mostrado à parte). */
export function formatCurrencyAbsBRL(value: number): string {
  return (
    'R$ ' +
    Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}
