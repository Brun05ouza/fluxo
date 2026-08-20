import type { TourPlaybook } from './tourTypes';

export const IMPORTAR_EXTRATO_PLAYBOOK: TourPlaybook = {
  id: 'IMPORTAR_EXTRATO',
  title: 'Importar extrato',
  triggers: ['importar extrato', 'importar', 'csv', 'ofx', 'extrato'],
  steps: [
    {
      id: 'nav-importar',
      route: '/import',
      selector: 'fluxia-nav-import',
      title: 'Menu Importar',
      body: 'Comece por aqui: no menu lateral, "Importar" abre a tela de upload do extrato.',
      placement: 'right',
    },
    {
      id: 'dropzone',
      selector: 'fluxia-import-dropzone',
      title: 'Área de upload',
      body: 'Arraste o CSV ou OFX para esta área, ou clique para escolher o arquivo no computador.',
      placement: 'right',
    },
    {
      id: 'help',
      selector: 'fluxia-import-help',
      title: 'Ajuda por banco',
      body: 'Não sabe de onde baixar o extrato? Abra esta ajuda e siga o passo a passo do seu banco.',
      placement: 'top',
    },
  ],
};

export const NOVA_TRANSACAO_PLAYBOOK: TourPlaybook = {
  id: 'NOVA_TRANSACAO',
  title: 'Nova transação',
  triggers: ['nova transação', 'adicionar gasto', 'como registrar'],
  steps: [
    {
      id: 'tx-type',
      selector: 'fluxia-tx-type',
      title: 'Tipo de lançamento',
      body: 'Escolha Gasto (saída) ou Receita (entrada). O restante do formulário se adapta ao tipo.',
      placement: 'bottom',
    },
    {
      id: 'tx-valor',
      selector: 'fluxia-tx-valor',
      title: 'Valor',
      body: 'Informe o valor em reais. Use vírgula para centavos — por exemplo 150,50.',
      placement: 'bottom',
    },
    {
      id: 'tx-descricao',
      selector: 'fluxia-tx-descricao',
      title: 'Descrição',
      body: 'Dê um nome claro ao lançamento: Supermercado, Salário, Aluguel…',
      placement: 'left',
    },
    {
      id: 'tx-categoria',
      selector: 'fluxia-tx-categoria',
      title: 'Categoria',
      body: 'Classifique o lançamento. Isso alimenta gráficos, orçamentos e o score do mês.',
      placement: 'left',
    },
    {
      id: 'tx-data',
      selector: 'fluxia-tx-data',
      title: 'Data',
      body: 'Data em que a movimentação aconteceu. Por padrão, usamos hoje.',
      placement: 'left',
    },
    {
      id: 'tx-pagamento',
      selector: 'fluxia-tx-pagamento',
      title: 'Forma de pagamento',
      body: 'Cartão, débito, PIX, dinheiro ou boleto — como o valor saiu ou entrou.',
      placement: 'left',
    },
    {
      id: 'tx-mindful',
      selector: 'fluxia-tx-mindful',
      title: 'Tipo de gasto',
      body: 'Em gastos, marque Essencial, Opcional ou Emocional. Isso aparece na análise de comportamento.',
      placement: 'left',
    },
    {
      id: 'tx-recorrente',
      selector: 'fluxia-tx-recorrente',
      title: 'Repetir',
      body: 'Se for mensal (aluguel, assinatura), ative Repetir para criar as próximas parcelas automaticamente.',
      placement: 'left',
    },
    {
      id: 'tx-botoes',
      selector: 'fluxia-tx-botoes',
      title: 'Salvar',
      body: 'Quando estiver pronto, clique em Salvar. Cancelar descarta o rascunho.',
      placement: 'top',
    },
  ],
};

export const FILTRAR_TRANSACOES_PLAYBOOK: TourPlaybook = {
  id: 'FILTRAR_TRANSACOES',
  title: 'Filtrar transações',
  triggers: ['filtrar', 'buscar transação'],
  steps: [
    {
      id: 'nav-transactions',
      route: '/transactions',
      selector: 'fluxia-nav-transactions',
      title: 'Menu Transações',
      body: 'Abra Transações no menu para ver, buscar e filtrar seus lançamentos.',
      placement: 'right',
    },
    {
      id: 'search',
      selector: 'fluxia-tx-search',
      title: 'Busca',
      body: 'Digite parte da descrição ou categoria para achar um lançamento rápido.',
      placement: 'bottom',
    },
    {
      id: 'filters',
      selector: 'fluxia-tx-filters',
      title: 'Filtros',
      body: 'Filtre por categoria, tipo (receita/despesa) ou período do mês.',
      placement: 'bottom',
    },
  ],
};

export const CRIAR_ORCAMENTO_PLAYBOOK: TourPlaybook = {
  id: 'CRIAR_ORCAMENTO',
  title: 'Criar orçamento',
  triggers: ['orçamento', 'criar orçamento'],
  steps: [
    {
      id: 'nav-budgets',
      route: '/budgets',
      selector: 'fluxia-nav-budgets',
      title: 'Menu Orçamentos',
      body: 'Em Orçamentos você define limites por categoria e acompanha o uso do mês.',
      placement: 'right',
    },
    {
      id: 'new-budget',
      selector: 'fluxia-budgets-new',
      title: 'Novo orçamento',
      body: 'Clique em Novo Orçamento para escolher a categoria e o limite em reais.',
      placement: 'left',
    },
    {
      id: 'budget-form',
      selector: 'fluxia-budgets-form',
      title: 'Categoria e limite',
      body: 'Neste modal escolha a categoria, informe o limite mensal em reais e salve. O Fluxo avisa quando você se aproxima do teto.',
      placement: 'left',
    },
  ],
};

export const CATEGORIAS_PLAYBOOK: TourPlaybook = {
  id: 'CATEGORIAS',
  title: 'Categorias',
  triggers: ['categorias', 'categoria'],
  steps: [
    {
      id: 'nav-transactions',
      route: '/transactions',
      selector: 'fluxia-nav-transactions',
      title: 'Transações',
      body: 'As categorias aparecem em cada lançamento. Abra Transações para revisar ou filtrar por categoria.',
      placement: 'right',
    },
    {
      id: 'category-filter',
      selector: 'fluxia-tx-filters',
      title: 'Filtrar por categoria',
      body: 'Use o filtro de categoria para ver só Alimentação, Moradia, Transporte e outras. Para mudar a categoria de um item, edite o lançamento.',
      placement: 'bottom',
    },
  ],
};

export const RELATORIOS_PLAYBOOK: TourPlaybook = {
  id: 'VER_RELATORIOS',
  title: 'Análise',
  triggers: ['relatórios', 'relatório', 'onde gastando mais'],
  steps: [
    {
      id: 'nav-reports',
      route: '/reports/analise',
      selector: 'fluxia-nav-accounts',
      title: 'Menu Contas',
      body: 'Em Contas você encontra a aba Análise com comparação mensal e comportamento de gastos.',
      placement: 'right',
    },
    {
      id: 'reports-page',
      selector: 'fluxia-reports-page',
      title: 'Análise',
      body: 'Aqui você vê categorias mais caras e o relatório Essencial / Opcional / Emocional.',
      placement: 'bottom',
    },
  ],
};

export const CONFIGURACOES_TEMA_PLAYBOOK: TourPlaybook = {
  id: 'CONFIGURACOES_TEMA',
  title: 'Configurações e tema',
  triggers: ['configurações', 'tema', 'modo escuro'],
  steps: [
    {
      id: 'nav-settings',
      route: '/settings',
      selector: 'fluxia-nav-settings',
      title: 'Menu Configurações',
      body: 'Abra Configurações no menu para ajustar aparência, renda e outras opções da conta.',
      placement: 'right',
    },
    {
      id: 'theme',
      selector: 'fluxia-settings-theme',
      title: 'Aparência',
      body: 'Alterne entre tema claro e escuro quando quiser. A escolha vale para todo o app.',
      placement: 'left',
    },
  ],
};

export const ENTENDER_SCORE_PLAYBOOK: TourPlaybook = {
  id: 'ENTENDER_SCORE',
  title: 'Entender score',
  triggers: ['score', 'entender score', 'como funciona o score'],
  steps: [
    {
      id: 'dashboard-score',
      route: '/',
      selector: 'fluxia-dashboard-score',
      title: 'Score do mês',
      body: 'O score vai de 0 a 100 e resume orçamento, categorização e organização do mês.',
      placement: 'right',
    },
    {
      id: 'score-suggestions',
      selector: 'fluxia-dashboard-score-suggestions',
      title: 'Sugestões para subir',
      body: 'Ao lado do número aparecem dicas práticas: criar orçamento, categorizar lançamentos ou revisar gastos.',
      placement: 'left',
    },
  ],
};

export const ENTENDER_RELATORIO_PLAYBOOK: TourPlaybook = {
  id: 'ENTENDER_RELATORIO',
  title: 'Entender relatório',
  triggers: ['entender relatório', 'relatório comportamento', 'essencial opcional emocional'],
  steps: [
    {
      id: 'nav-reports',
      route: '/reports/analise',
      selector: 'fluxia-nav-accounts',
      title: 'Ir para Análise',
      body: 'Pelo menu Contas você chega na Análise e no relatório por comportamento.',
      placement: 'right',
    },
    {
      id: 'reports-page',
      selector: 'fluxia-reports-page',
      title: 'Comportamento',
      body: 'Os gastos se dividem em Essencial, Opcional e Emocional. Marque o tipo ao editar cada lançamento.',
      placement: 'bottom',
    },
  ],
};

export const PLAYBOOKS: TourPlaybook[] = [
  IMPORTAR_EXTRATO_PLAYBOOK,
  NOVA_TRANSACAO_PLAYBOOK,
  FILTRAR_TRANSACOES_PLAYBOOK,
  CRIAR_ORCAMENTO_PLAYBOOK,
  CATEGORIAS_PLAYBOOK,
  RELATORIOS_PLAYBOOK,
  CONFIGURACOES_TEMA_PLAYBOOK,
  ENTENDER_SCORE_PLAYBOOK,
  ENTENDER_RELATORIO_PLAYBOOK,
];

/** Intents do chat → id do playbook (quando os nomes diferem). */
const INTENT_ALIASES: Record<string, string> = {
  IMPORT_EXTRATO: 'IMPORTAR_EXTRATO',
  CONFIGURACOES: 'CONFIGURACOES_TEMA',
  GERENCIAR_CATEGORIAS: 'CATEGORIAS',
};

export function getPlaybookByIntent(intent: string): TourPlaybook | undefined {
  const id = INTENT_ALIASES[intent] ?? intent;
  return PLAYBOOKS.find((p) => p.id === id);
}
