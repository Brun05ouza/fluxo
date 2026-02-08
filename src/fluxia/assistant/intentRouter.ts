import type { FluxiaIntent, FluxiaResponse } from './types';

type IntentConfig = {
  intent: FluxiaIntent;
  keywords: (string | RegExp)[];
  text: string;
  hasGuide: boolean;
  openPage?: string;
};

const INTENTS: IntentConfig[] = [
  {
    intent: 'IMPORT_EXTRATO',
    keywords: [
      'importar', 'extrato', 'csv', 'ofx', 'banco', 'arquivo',
      /importa(r|ção|r extrato)/i,
      /extrato (do |da )?banco/i,
      /onde (importo|importar)/i,
    ],
    text: 'Para importar seu extrato: vá em Importar no menu lateral, arraste o arquivo CSV ou OFX na área indicada ou clique para selecionar. Depois revise e confirme.',
    hasGuide: true,
    openPage: '/import',
  },
  {
    intent: 'NOVA_TRANSACAO',
    keywords: [
      'nova transação', 'adicionar gasto', 'adicionar despesa', 'registrar gasto',
      /(adicionar|nova|registrar) (gasto|transação|despesa)/i,
      /como (adiciono|adicionar) (um )?gasto/i,
    ],
    text: 'Para adicionar uma transação manualmente: clique no botão "Nova Transação" no topo da tela. Preencha data, valor, descrição e categoria.',
    hasGuide: true,
    openPage: '/',
  },
  {
    intent: 'CRIAR_ORCAMENTO',
    keywords: [
      'orçamento', 'orcamento', 'limite', 'categoria mensal',
      /criar orçamento/i,
      /definir limite/i,
      /(onde|como) (crio|criar) orçamento/i,
    ],
    text: 'Para criar orçamentos por categoria: vá em Orçamentos no menu lateral. Defina limites por mês para cada categoria.',
    hasGuide: true,
    openPage: '/budgets',
  },
  {
    intent: 'VER_RELATORIOS',
    keywords: [
      'relatório', 'relatorio', 'gráfico', 'grafico', 'resumo', 'visão geral',
      /ver relatório/i,
      /onde (vejo|ver) (os )?relatórios/i,
    ],
    text: 'Os relatórios ficam no menu lateral em "Relatórios". Lá você vê gráficos, resumos por categoria e tendências.',
    hasGuide: true,
    openPage: '/reports',
  },
  {
    intent: 'GERENCIAR_CATEGORIAS',
    keywords: [
      'categoria', 'categorias', 'editar categoria', 'organizar',
      /(gerenciar|editar|organizar) categoria/i,
    ],
    text: 'As categorias podem ser ajustadas durante a importação ou na tela de transações, ao editar cada lançamento.',
    hasGuide: true,
  },
  {
    intent: 'CONFIGURACOES',
    keywords: [
      'configuração', 'config', 'configurações', 'tema', 'ajustes',
      /onde (está|ficam) as configurações/i,
      /(mudar|alterar) tema/i,
    ],
    text: 'As configurações ficam no menu lateral. Lá você pode alterar tema, perfil e outras opções.',
    hasGuide: true,
    openPage: '/settings',
  },
];

function normalizeInput(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function detectIntent(userInput: string): FluxiaResponse {
  const normalized = normalizeInput(userInput);
  if (!normalized) {
    return {
      intent: 'UNKNOWN',
      text: 'Como posso te ajudar? Tente perguntar sobre importar extrato, adicionar gastos ou ver relatórios.',
      hasGuide: false,
    };
  }

  for (const config of INTENTS) {
    for (const kw of config.keywords) {
      if (typeof kw === 'string') {
        if (normalized.includes(kw.toLowerCase())) {
          return {
            intent: config.intent,
            text: config.text,
            hasGuide: config.hasGuide,
            openPage: config.openPage,
          };
        }
      } else {
        if (kw.test(userInput) || kw.test(normalized)) {
          return {
            intent: config.intent,
            text: config.text,
            hasGuide: config.hasGuide,
            openPage: config.openPage,
          };
        }
      }
    }
  }

  return {
    intent: 'UNKNOWN',
    text: 'Não encontrei exatamente isso. Você pode tentar: "Como importo o extrato?", "Adicionar gasto" ou "Ver relatórios".',
    hasGuide: false,
  };
}
