import { describe, expect, it } from 'vitest';
import { detectIntent } from './intentRouter';
import type { FluxiaIntent } from './types';

/** 19 frases do LEVANTAMENTO_BANCA A.5 (resultado pós-correção) + extras pedidos. */
const CASES: Array<{ phrase: string; intent: FluxiaIntent }> = [
  { phrase: 'como fazer transações', intent: 'NOVA_TRANSACAO' },
  { phrase: 'como registrar uma transação', intent: 'NOVA_TRANSACAO' },
  { phrase: 'como adiciono uma despesa', intent: 'NOVA_TRANSACAO' },
  { phrase: 'quero lançar um gasto', intent: 'NOVA_TRANSACAO' },
  { phrase: 'como cadastrar uma receita', intent: 'NOVA_TRANSACAO' },
  { phrase: 'como importar meu extrato', intent: 'IMPORT_EXTRATO' },
  { phrase: 'como vincular um lançamento', intent: 'VINCULAR' },
  { phrase: 'como preparar o mês', intent: 'PREPARAR_MES' },
  { phrase: 'o que é previsão', intent: 'PREPARAR_MES' },
  { phrase: 'como funciona o orçamento', intent: 'CRIAR_ORCAMENTO' },
  { phrase: 'como definir um limite por categoria', intent: 'CRIAR_ORCAMENTO' },
  { phrase: 'como cadastrar conta fixa', intent: 'CONTAS_FIXAS' },
  { phrase: 'onde vejo meus gastos por categoria', intent: 'VER_RELATORIOS' },
  { phrase: 'como excluir uma transação', intent: 'NOVA_TRANSACAO' },
  { phrase: 'o que é o score', intent: 'ENTENDER_SCORE' },
  { phrase: 'como mudar o tema', intent: 'CONFIGURACOES' },
  { phrase: 'oi', intent: 'GREETING' },
  { phrase: 'obrigada', intent: 'THANKS' },
  { phrase: 'que dia é hoje', intent: 'UNKNOWN' },
  { phrase: 'como funciona o score', intent: 'ENTENDER_SCORE' },
  { phrase: 'preparar o mês', intent: 'PREPARAR_MES' },
];

describe('detectIntent', () => {
  it.each(CASES)('$phrase → $intent', ({ phrase, intent }) => {
    expect(detectIntent(phrase).intent).toBe(intent);
  });
});
