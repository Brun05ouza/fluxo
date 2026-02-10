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
      body: 'Clique em "Importar" no menu lateral para acessar a tela de importação de extratos.',
      placement: 'right',
    },
    {
      id: 'dropzone',
      selector: 'fluxia-import-dropzone',
      title: 'Área de upload',
      body: 'Arraste seu arquivo CSV ou OFX aqui, ou clique para selecionar. Formatos aceitos: CSV e OFX.',
      placement: 'top',
    },
    {
      id: 'help',
      selector: 'fluxia-import-help',
      title: 'Ajuda por banco',
      body: 'Se não souber onde exportar o extrato no seu banco, clique aqui para ver o passo a passo por instituição.',
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
      title: 'Tipo de transação',
      body: 'Escolha entre Gasto (saída de dinheiro) ou Receita (entrada). O formulário se adapta ao tipo selecionado.',
      placement: 'bottom',
    },
    {
      id: 'tx-valor',
      selector: 'fluxia-tx-valor',
      title: 'Valor',
      body: 'Informe o valor em reais. Use vírgula para centavos, ex: 150,50. Para receita, o valor será positivo; para gasto, negativo.',
      placement: 'bottom',
    },
    {
      id: 'tx-descricao',
      selector: 'fluxia-tx-descricao',
      title: 'Descrição',
      body: 'Nome ou título da transação. Ex: Supermercado, Restaurante, Salário. Este campo é obrigatório.',
      placement: 'bottom',
    },
    {
      id: 'tx-observacao',
      selector: 'fluxia-tx-observacao',
      title: 'Observação',
      body: 'Campo opcional para detalhes extras. Ex: compras do mês, nota fiscal, etc.',
      placement: 'bottom',
    },
    {
      id: 'tx-categoria',
      selector: 'fluxia-tx-categoria',
      title: 'Categoria',
      body: 'Classifique a transação: Alimentação, Transporte, Moradia, Lazer, Saúde, Educação e outras. Ajuda nos relatórios.',
      placement: 'top',
    },
    {
      id: 'tx-data',
      selector: 'fluxia-tx-data',
      title: 'Data',
      body: 'Data em que a transação ocorreu. Por padrão, usa a data de hoje.',
      placement: 'top',
    },
    {
      id: 'tx-pagamento',
      selector: 'fluxia-tx-pagamento',
      title: 'Forma de pagamento',
      body: 'Como você pagou: Cartão de Crédito, Débito, Dinheiro, PIX ou Boleto.',
      placement: 'bottom',
    },
    {
      id: 'tx-mindful',
      selector: 'fluxia-tx-mindful',
      title: 'Tipo de gasto (Mindful)',
      body: 'Classifique o gasto: Essencial (necessário), Opcional (conforto) ou Emocional (impulso). Ajuda nos insights de comportamento.',
      placement: 'top',
    },
    {
      id: 'tx-tags',
      selector: 'fluxia-tx-tags',
      title: 'Tags',
      body: 'Tags opcionais para organizar. Ex: viagem, mercado, aniversário. Separe por vírgula.',
      placement: 'top',
    },
    {
      id: 'tx-recorrente',
      selector: 'fluxia-tx-recorrente',
      title: 'Transação recorrente',
      body: 'Marque se essa despesa se repete todo mês (ex: aluguel, assinatura). Ela aparecerá nos próximos vencimentos.',
      placement: 'top',
    },
    {
      id: 'tx-botoes',
      selector: 'fluxia-tx-botoes',
      title: 'Salvar ou cancelar',
      body: 'Depois de preencher, clique em Salvar para registrar a transação. Ou em Cancelar para descartar.',
      placement: 'top',
    },
  ],
};

export const FILTRAR_TRANSACOES_PLAYBOOK: TourPlaybook = {
  id: 'FILTRAR_TRANSACOES',
  title: 'Filtrar transações',
  triggers: ['filtrar', 'buscar transação'],
  steps: [],
};

export const CRIAR_ORCAMENTO_PLAYBOOK: TourPlaybook = {
  id: 'CRIAR_ORCAMENTO',
  title: 'Criar orçamento',
  triggers: ['orçamento', 'criar orçamento'],
  steps: [],
};

export const CATEGORIAS_PLAYBOOK: TourPlaybook = {
  id: 'CATEGORIAS',
  title: 'Categorias',
  triggers: ['categorias', 'categoria'],
  steps: [],
};

export const RELATORIOS_PLAYBOOK: TourPlaybook = {
  id: 'VER_RELATORIOS',
  title: 'Relatórios',
  triggers: ['relatórios', 'relatório', 'onde gastando mais'],
  steps: [
    {
      id: 'nav-reports',
      route: '/reports',
      selector: 'fluxia-reports-page',
      title: 'Relatórios',
      body: 'Aqui você vê comparação mensal, categorias mais caras e relatório por comportamento (Essencial, Opcional, Emocional).',
      placement: 'bottom',
    },
  ],
};

export const CONFIGURACOES_TEMA_PLAYBOOK: TourPlaybook = {
  id: 'CONFIGURACOES_TEMA',
  title: 'Configurações e tema',
  triggers: ['configurações', 'tema', 'modo escuro'],
  steps: [],
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
      body: 'O score vai de 0 a 100 e mostra como está seu controle no mês: orçamento, categorização e uso dos gastos.',
      placement: 'bottom',
    },
    {
      id: 'score-suggestions',
      selector: 'fluxia-dashboard-score-suggestions',
      title: 'Sugestões para subir',
      body: 'Aqui aparecem ações para melhorar o score: criar orçamento, categorizar lançamentos ou revisar gastos.',
      placement: 'top',
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
      route: '/reports',
      selector: 'fluxia-reports-page',
      title: 'Relatório por comportamento',
      body: 'Os gastos são classificados em Essencial (necessário), Opcional (conforto) e Emocional (impulso). Marque o tipo em cada transação para ver a análise.',
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

export function getPlaybookByIntent(intent: string): TourPlaybook | undefined {
  return PLAYBOOKS.find((p) => p.id === intent);
}
