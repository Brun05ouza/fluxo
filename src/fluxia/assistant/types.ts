export type FluxiaIntent =
  | 'IMPORT_EXTRATO'
  | 'NOVA_TRANSACAO'
  | 'CRIAR_ORCAMENTO'
  | 'VER_RELATORIOS'
  | 'GERENCIAR_CATEGORIAS'
  | 'CONFIGURACOES'
  | 'ENTENDER_SCORE'
  | 'ENTENDER_RELATORIO'
  | 'CONTAS_FIXAS'
  | 'CONTAS'
  | 'GREETING'
  | 'HELP'
  | 'THANKS'
  | 'FAREWELL'
  | 'UNKNOWN';

export interface FluxiaResponse {
  intent: FluxiaIntent;
  text: string;
  hasGuide: boolean;
  openPage?: string;
}

export interface FluxiaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  response?: FluxiaResponse;
}
