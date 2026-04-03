/**
 * Microcopy centralizado (PT-BR) para o Fluxo.
 * Usado em empty states, labels, CTAs e mensagens de sucesso.
 */

export const emptyStates = {
  dashboard: {
    title: 'Comece por aqui',
    description: 'Importe seu extrato ou adicione seu primeiro lançamento para ver seu mês em ordem.',
    bullets: [
      'Veja gastos e receitas em um só lugar',
      'Acompanhe o score do mês e as missões',
      'Controle orçamentos por categoria',
    ],
    primaryCta: 'Importar extrato',
    secondaryCta: 'Adicionar transação',
    guideCta: 'Me guiar com o Flux.ia',
  },
  transactions: {
    title: 'Nenhuma transação neste mês',
    description: 'Comece importando seu extrato ou adicionando um lançamento rápido.',
    primaryCta: 'Importar extrato',
    secondaryCta: 'Nova transação',
    filterEmpty: 'Nenhum lançamento encontrado. Ajuste os filtros ou adicione uma nova transação.',
  },
  import: {
    title: 'Nenhuma transação encontrada',
    description: 'Verifique o formato do arquivo (CSV ou OFX) e tente novamente.',
    retryCta: 'Tentar outro arquivo',
  },
  importPreview: {
    noData: 'Nenhum dado para revisar.',
    backCta: 'Voltar',
  },
  budgets: {
    title: 'Nenhum orçamento configurado',
    description: 'Crie seu primeiro orçamento para evitar surpresas no mês.',
    primaryCta: 'Novo orçamento',
    guideCta: 'Me guiar com o Flux.ia',
  },
  reports: {
    title: 'Sem dados suficientes',
    description: 'Importe um extrato ou registre lançamentos para ver relatórios.',
    primaryCta: 'Importar extrato',
    secondaryCta: 'Nova transação',
    guideCta: 'Me guiar com o Flux.ia',
  },
  fixedExpenses: {
    title: 'Nenhuma obrigação cadastrada',
    description: 'Adicione suas contas fixas: aluguel, luz, internet, assinaturas.',
    primaryCta: 'Adicionar obrigação',
    hint: 'Importe o extrato para marcar pagamentos automaticamente (em breve).',
  },
} as const;

export const labels = {
  kpiGastos: 'Gastos do mês',
  kpiReceitas: 'Receitas',
  kpiSaldo: 'Saldo em caixa',
  visaoDoMes: 'Visão do mês',
  acaoPrincipal: 'Ação principal do mês',
  scoreDoMes: 'Score financeiro do mês',
  missoesDoMes: 'Missões do mês',
  ultimasTransacoes: 'Últimas transações',
  gastosPorCategoria: 'Gastos por categoria',
  contasFixasDoMes: 'Contas fixas do mês',
  percentualRenda: 'Isso representa {percent}% da sua renda.',
  gerenciarContasFixas: 'Gerenciar contas fixas',
  limparFiltros: 'Limpar filtros',
  usado: 'Usado',
  restante: 'Restante',
  totalOrcado: 'Total orçado',
  totalGasto: 'Total gasto',
  restanteDoMes: 'Restante do mês',
} as const;

export const ctas = {
  importarExtrato: 'Importar extrato',
  novaTransacao: 'Nova transação',
  categorizar: 'Categorizar lançamentos',
  criarOrcamento: 'Criar orçamento',
  novoOrcamento: 'Novo orçamento',
  verRelatorio: 'Ver relatório do mês',
  verRelatorioComportamento: 'Ver relatório por comportamento',
  verTransacoes: 'Ver transações',
  confirmarImportacao: 'Confirmar importação',
  adicionarObrigacao: 'Adicionar obrigação',
} as const;

export const hints = {
  score: 'Baseado em orçamento, categorização e controle.',
  importSecurity: 'Você revisa tudo antes de salvar.',
  importSteps: ['Envie o extrato', 'Revise as transações', 'Confirme e pronto'],
} as const;

export const success = {
  importDone: 'Importação concluída: {count} transações.',
  importDoneCta: 'Ver transações',
} as const;

export const dashboardActionTitles = {
  importFirst: 'Comece importando seu extrato',
  categorize: 'Organize seus lançamentos',
  createBudget: 'Defina limites por categoria',
  seeReport: 'Veja como foi seu mês',
} as const;
