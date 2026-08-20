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
      'importar',
      'extrato',
      'csv',
      'ofx',
      'banco',
      'arquivo',
      'planilha',
      /importa(r|cao|r extrato)/i,
      /extrato (do |da )?banco/i,
      /onde (importo|importar)/i,
      /como importar/i,
      /subir (o )?arquivo/i,
      /carregar (o )?extrato/i,
      /trazer (meus )?lancamentos/i,
    ],
    text: 'Para importar seu extrato: vá em Importar no menu, arraste o arquivo CSV ou OFX na área indicada. Revise as categorias e clique em "Importar extrato" para confirmar.',
    hasGuide: true,
    openPage: '/import',
  },
  {
    intent: 'NOVA_TRANSACAO',
    keywords: [
      'nova transacao',
      'adicionar gasto',
      'adicionar receita',
      'registrar gasto',
      'lancamento',
      'despesa',
      'receita',
      /(adicionar|nova|novo|registrar|criar) (um |uma )?(gasto|transacao|receita|despesa|lancamento)/i,
      /como (adiciono|adicionar|registro|registrar|lanço|lancar)/i,
      /quero (registrar|adicionar|lancar)/i,
      /anotar (um )?gasto/i,
    ],
    text: 'Para adicionar um lançamento: no menu lateral, em "Nova transação", escolha Receita ou Despesa e preencha valor, descrição, data e categoria.',
    hasGuide: true,
    openPage: '/',
  },
  {
    intent: 'CRIAR_ORCAMENTO',
    keywords: [
      'orcamento',
      'limite',
      'categoria mensal',
      /criar orcamento/i,
      /definir limite/i,
      /(onde|como) (crio|criar|faco|fazer) orcamento/i,
      /controlar (meus )?gastos/i,
      /limite (por |de )?categoria/i,
      /meta (de )?gasto/i,
    ],
    text: 'Para criar orçamento por categoria: vá em Orçamentos no menu. Defina o limite em reais para cada categoria. O Fluxo avisa quando você se aproxima ou estoura o limite.',
    hasGuide: true,
    openPage: '/budgets',
  },
  {
    intent: 'VER_RELATORIOS',
    keywords: [
      'relatorio',
      'grafico',
      'resumo',
      'visao geral',
      'onde gasto',
      'gastando mais',
      'onde estou gastando',
      'analise',
      /ver relatorio/i,
      /onde (vejo|ver) (os )?relatorios/i,
      /onde (estou )?gastando mais/i,
      /(onde|em que) (gasto|estou gastando)/i,
      /meus gastos/i,
      /como (estao|estão) (meus )?gastos/i,
      /ver (o )?painel|dashboard|analise financeira/i,
    ],
    text: 'No menu "Contas", abra a aba "Análise" para ver onde está gastando mais, categorias mais caras e evolução por tipo (Essencial, Opcional, Emocional).',
    hasGuide: true,
    openPage: '/reports/analise',
  },
  {
    intent: 'GERENCIAR_CATEGORIAS',
    keywords: [
      'categoria',
      'categorias',
      'editar categoria',
      'organizar',
      /(gerenciar|editar|organizar|mudar) categoria/i,
      /classificar (gastos|lancamentos)/i,
    ],
    text: 'As categorias podem ser ajustadas durante a importação ou na tela de transações, ao editar cada lançamento.',
    hasGuide: true,
  },
  {
    intent: 'CONFIGURACOES',
    keywords: [
      'configuracao',
      'config',
      'configuracoes',
      'tema',
      'ajustes',
      'perfil',
      /onde (esta|ficam|fica) (as )?configuracoes/i,
      /(mudar|alterar) (o )?tema/i,
      /modo (escuro|claro)/i,
      /dark mode|light mode/i,
    ],
    text: 'As configurações ficam no menu lateral. Lá você pode alterar tema, perfil e outras opções.',
    hasGuide: true,
    openPage: '/settings',
  },
  {
    intent: 'ENTENDER_SCORE',
    keywords: [
      'score',
      'entender score',
      'como funciona o score',
      'o que e o score',
      'pontuacao',
      /(entender|o que e|como funciona) (o )?score/i,
      /score (do mes|financeiro)/i,
      /minha nota|pontos do mes/i,
    ],
    text: 'O score vai de 0 a 100 e reflete orçamento, categorização e controle do mês. Quanto maior, melhor. Abaixo do score aparecem sugestões do que fazer para subir (ex.: criar orçamento, categorizar lançamentos).',
    hasGuide: true,
    openPage: '/',
  },
  {
    intent: 'ENTENDER_RELATORIO',
    keywords: [
      'entender relatorio',
      'relatorio comportamento',
      'essencial opcional emocional',
      /(entender|explicar) (o )?relatorio/i,
      /relatorio (por )?comportamento/i,
      /essencial opcional emocional/i,
      /gasto emocional|gasto essencial/i,
    ],
    text: 'No relatório por comportamento, os gastos são classificados em Essencial (necessário), Opcional (conforto) e Emocional (impulso). Marque o tipo ao editar cada transação para ver a análise.',
    hasGuide: true,
    openPage: '/reports/analise',
  },
  {
    intent: 'CONTAS_FIXAS',
    keywords: [
      'conta fixa',
      'contas fixas',
      'obrigacao',
      'aluguel',
      'assinatura',
      /despesa(s)? fixa(s)?/i,
      /contas? (do )?mes/i,
      /(luz|agua|internet|energia)/i,
    ],
    text: 'Em Contas fixas no menu você cadastra obrigações mensais (aluguel, luz, assinaturas). Informe nome, valor e dia do vencimento para acompanhar o total do mês.',
    hasGuide: false,
    openPage: '/fixed-expenses',
  },
  {
    intent: 'CONTAS',
    keywords: [
      'minhas contas',
      'carteira',
      'conta bancaria',
      'cartao',
      /abrir conta/i,
      /gerenciar contas/i,
      /saldo (da |das )?contas?/i,
    ],
    text: 'Em Contas você organiza carteiras, bancos e cartões. O saldo e o que entra na soma da tela inicial podem ser ajustados por conta.',
    hasGuide: false,
    openPage: '/accounts',
  },
];

const GREETING_RE =
  /^(oi+|ola+|olá+|oii+|oie|hey|hi|hello|eai|e ai|eae|opa|fala|falai|salve|bom dia|boa tarde|boa noite|e ai( beleza)?|tudo bem\??|td bem\??|beleza\??|blz\??)[\s!?.😊👋]*$/i;

const GREETING_SOFT_RE =
  /^(oi+|ola+|olá+|hey|hi)\b.{0,40}$/i;

const THANKS_RE =
  /^(obrigad[oa]s?|valeu|vlw|tmj|thanks|thank you|muito obrigad[oa]|obg|brigad[oa])[\s!?.]*$/i;

const FAREWELL_RE =
  /^(tchau|xau|ate logo|até logo|flw|falou|bye|goodbye|ate mais|até mais|fui)[\s!?.]*$/i;

const HELP_RE =
  /(^|\b)(ajuda|help|socorro|o que (voce|vc|tu) (faz|pode)|como (funciona|usar)|o que (posso|da pra|dá pra) (perguntar|fazer)|me (ajuda|explica)|nao sei (usar|por onde)|não sei (usar|por onde)|comandos|opcoes|opções|menu)(\b|$)/i;

const SUGGESTIONS =
  'Você pode perguntar, por exemplo:\n• "Como importo o extrato?"\n• "Adicionar um gasto"\n• "Criar orçamento"\n• "Onde estou gastando mais?"\n• "Como funciona o score?"';

function normalizeInput(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function response(
  intent: FluxiaIntent,
  text: string,
  extras: Partial<Pick<FluxiaResponse, 'hasGuide' | 'openPage'>> = {},
): FluxiaResponse {
  return {
    intent,
    text,
    hasGuide: extras.hasGuide ?? false,
    openPage: extras.openPage,
  };
}

function matchKeywords(normalized: string, original: string, keywords: (string | RegExp)[]): boolean {
  for (const kw of keywords) {
    if (typeof kw === 'string') {
      const needle = normalizeInput(kw);
      if (needle.length <= 3) {
        const re = new RegExp(`(?:^|\\s)${needle}(?:\\s|$|[!?.,])`, 'i');
        if (re.test(normalized)) return true;
      } else if (normalized.includes(needle)) {
        return true;
      }
    } else if (kw.test(original) || kw.test(normalized)) {
      return true;
    }
  }
  return false;
}

export function detectIntent(userInput: string): FluxiaResponse {
  const trimmed = userInput.trim();
  const normalized = normalizeInput(trimmed);

  if (!normalized) {
    return response(
      'HELP',
      `Como posso te ajudar?\n\n${SUGGESTIONS}`,
    );
  }

  if (GREETING_RE.test(trimmed) || GREETING_RE.test(normalized) || GREETING_SOFT_RE.test(normalized)) {
    const greetings = [
      'Oi! Eu sou o Flux.ia. Como posso te ajudar hoje?',
      'Olá! Pronto para organizar suas finanças. Em que posso ajudar?',
      'E aí! Me diga o que você quer fazer no Fluxo.',
    ];
    return response('GREETING', `${greetings[Math.floor(Math.random() * greetings.length)]}\n\n${SUGGESTIONS}`);
  }

  if (THANKS_RE.test(trimmed) || THANKS_RE.test(normalized)) {
    return response(
      'THANKS',
      'Por nada! Se precisar de mais alguma coisa, é só chamar.',
    );
  }

  if (FAREWELL_RE.test(trimmed) || FAREWELL_RE.test(normalized)) {
    return response(
      'FAREWELL',
      'Até logo! Qualquer dúvida, estou por aqui.',
    );
  }

  if (HELP_RE.test(trimmed) || HELP_RE.test(normalized)) {
    return response(
      'HELP',
      `Posso te guiar pelo Fluxo: importar extrato, lançar gastos, orçamentos, relatórios, score e configurações.\n\n${SUGGESTIONS}`,
    );
  }

  for (const config of INTENTS) {
    if (matchKeywords(normalized, trimmed, config.keywords)) {
      return {
        intent: config.intent,
        text: config.text,
        hasGuide: config.hasGuide,
        openPage: config.openPage,
      };
    }
  }

  const unknownReplies = [
    `Hmm, não entendi bem "${trimmed}".`,
    'Não reconheci essa mensagem.',
    'Ainda não sei responder isso exatamente.',
  ];
  const lead = unknownReplies[Math.floor(Math.random() * unknownReplies.length)];

  return response(
    'UNKNOWN',
    `${lead} Tenta reformular ou escolhe uma das opções abaixo.\n\n${SUGGESTIONS}`,
  );
}
