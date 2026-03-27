/** Instituições apenas visuais (ícone/cor), sem API bancária */

export interface FinancialInstitution {
  key: string;
  name: string;
  color: string;
}

export const FINANCIAL_INSTITUTIONS: FinancialInstitution[] = [
  { key: 'nubank', name: 'Nubank', color: '#8A05BE' },
  { key: 'inter', name: 'Inter', color: '#FF7A00' },
  { key: 'mercado-pago', name: 'Mercado Pago', color: '#009EE3' },
  { key: 'itau', name: 'Itaú', color: '#EC7000' },
  { key: 'bradesco', name: 'Bradesco', color: '#CC092F' },
  { key: 'bb', name: 'Banco do Brasil', color: '#F8E71C' },
  { key: 'caixa', name: 'Caixa', color: '#003366' },
  { key: 'santander', name: 'Santander', color: '#EC0000' },
  { key: 'picpay', name: 'PicPay', color: '#21C25E' },
  { key: 'c6', name: 'C6 Bank', color: '#000000' },
  { key: 'original', name: 'Banco Original', color: '#FF8C00' },
  { key: 'btg', name: 'BTG Pactual', color: '#001E50' },
  { key: 'xp', name: 'XP Investimentos', color: '#111111' },
  { key: 'rico', name: 'Rico', color: '#7B68EE' },
  { key: 'custom', name: 'Outra / manual', color: '#64748b' },
];

export function getInstitutionByKey(key: string): FinancialInstitution | undefined {
  return FINANCIAL_INSTITUTIONS.find((i) => i.key === key);
}
