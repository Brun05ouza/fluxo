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
  title: 'Adicionar transação',
  triggers: ['nova transação', 'adicionar gasto'],
  steps: [
    {
      id: 'btn-nova',
      selector: 'fluxia-btn-nova-transacao',
      title: 'Nova transação',
      body: 'Clique aqui para abrir o formulário e registrar um gasto ou receita manualmente.',
      placement: 'bottom',
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
  id: 'RELATORIOS',
  title: 'Relatórios',
  triggers: ['relatórios', 'relatório'],
  steps: [],
};

export const CONFIGURACOES_TEMA_PLAYBOOK: TourPlaybook = {
  id: 'CONFIGURACOES_TEMA',
  title: 'Configurações e tema',
  triggers: ['configurações', 'tema', 'modo escuro'],
  steps: [],
};

export const PLAYBOOKS: TourPlaybook[] = [
  IMPORTAR_EXTRATO_PLAYBOOK,
  NOVA_TRANSACAO_PLAYBOOK,
  FILTRAR_TRANSACOES_PLAYBOOK,
  CRIAR_ORCAMENTO_PLAYBOOK,
  CATEGORIAS_PLAYBOOK,
  RELATORIOS_PLAYBOOK,
  CONFIGURACOES_TEMA_PLAYBOOK,
];

export function getPlaybookByIntent(intent: string): TourPlaybook | undefined {
  return PLAYBOOKS.find((p) => p.id === intent);
}
