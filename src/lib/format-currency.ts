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

/** Máscara de digitação: só dígitos → "1.234,56" (centavos). */
export function maskBRLInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  if (!digits) return '';
  const num = parseInt(digits, 10);
  return (num / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Converte máscara "1.234,56" (ou dígitos) em número. */
export function parseBRLInput(masked: string): number {
  const digits = masked.replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}
