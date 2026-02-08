export type FluxiaIntent =
  | 'IMPORT_EXTRATO'
  | 'NOVA_TRANSACAO'
  | 'CRIAR_ORCAMENTO'
  | 'VER_RELATORIOS'
  | 'GERENCIAR_CATEGORIAS'
  | 'CONFIGURACOES'
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
