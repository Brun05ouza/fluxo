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
      /como importar (o )?extrato/i,
    ],
    text: 'Para importar seu extrato: vá em Importar no menu, arraste o arquivo CSV ou OFX na área indicada. Revise as categorias e clique em "Importar extrato" para confirmar.',
    hasGuide: true,
    openPage: '/import',
  },
  {
    intent: 'NOVA_TRANSACAO',
    keywords: [
      'nova transação', 'adicionar gasto', 'adicionar receita', 'registrar gasto', 'lançamento',
      /(adicionar|nova|registrar) (gasto|transação|receita|lançamento)/i,
      /como (adiciono|adicionar) (um )?gasto/i,
    ],
    text: 'Para adicionar um lançamento: clique no botão "Nova Transação" no topo. Preencha valor, descrição, data e categoria (Gasto ou Receita).',
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
    text: 'Para criar orçamento por categoria: vá em Orçamentos no menu. Defina o limite em reais para cada categoria. O Fluxo avisa quando você se aproxima ou estoura o limite.',
    hasGuide: true,
    openPage: '/budgets',
  },
  {
    intent: 'VER_RELATORIOS',
    keywords: [
      'relatório', 'relatorio', 'gráfico', 'grafico', 'resumo', 'visão geral',
      'onde gasto', 'gastando mais', 'onde estou gastando',
      /ver relatório/i,
      /onde (vejo|ver) (os )?relatórios/i,
      /onde (estou )?gastando mais/i,
      /(onde|em que) (gasto|estou gastando)/i,
    ],
    text: 'Os relatórios ficam no menu em "Relatórios". Lá você vê onde está gastando mais, categorias mais caras e evolução por tipo (Essencial, Opcional, Emocional).',
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
  {
    intent: 'ENTENDER_SCORE',
    keywords: [
      'score', 'entender score', 'como funciona o score', 'o que é o score',
      /(entender|o que é|como funciona) (o )?score/i,
      /score (do mês|financeiro)/i,
    ],
    text: 'O score vai de 0 a 100 e reflete orçamento, categorização e controle do mês. Quanto maior, melhor. Abaixo do score aparecem sugestões do que fazer para subir (ex.: criar orçamento, categorizar lançamentos).',
    hasGuide: true,
    openPage: '/',
  },
  {
    intent: 'ENTENDER_RELATORIO',
    keywords: [
      'entender relatório', 'relatório comportamento', 'essencial opcional emocional',
      /(entender|explicar) (o )?relatório/i,
      /relatório (por )?comportamento/i,
      /essencial opcional emocional/i,
    ],
    text: 'No relatório por comportamento, os gastos são classificados em Essencial (necessário), Opcional (conforto) e Emocional (impulso). Marque o tipo ao editar cada transação para ver a análise.',
    hasGuide: true,
    openPage: '/reports',
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
