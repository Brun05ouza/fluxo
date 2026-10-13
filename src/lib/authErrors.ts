/**
 * Converte erros técnicos (Neon, rede, fetch) em mensagens claras em português.
 */

const SUPPORT_HINT =
  'Se o problema continuar, verifique sua conexão ou fale com o suporte.';

function isNetworkOrDnsError(message: string, error: unknown): boolean {
  const m = message.toLowerCase();
  if (
    m.includes('failed to fetch') ||
    m.includes('load failed') ||
    m.includes('networkerror') ||
    m.includes('network request failed') ||
    m.includes('err_name_not_resolved') ||
    m.includes('err_connection') ||
    m.includes('err_internet_disconnected')
  ) {
    return true;
  }
  if (error instanceof TypeError && m.includes('fetch')) {
    return true;
  }
  return false;
}

/**
 * Mensagem amigável para falha de conexão com a API (DNS, offline, CORS, etc.).
 */
export function connectionErrorMessage(): string {
  return `Não foi possível conectar ao servidor. Verifique sua internet e as configurações do app. ${SUPPORT_HINT}`;
}

/**
 * Mapeia erro bruto (Neon ou rede) para texto exibido ao usuário.
 */
export function mapAuthError(error: unknown): string {
  if (error == null) {
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  const message = error instanceof Error ? error.message : String(error);
  const trimmed = message.trim();
  if (!trimmed) {
    return `Algo deu errado. ${SUPPORT_HINT}`;
  }

  if (isNetworkOrDnsError(trimmed, error)) {
    return connectionErrorMessage();
  }

  const lower = trimmed.toLowerCase();

  // Login — credenciais inválidas (Neon não distingue "usuário não existe" de senha errada por segurança)
  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid credentials') ||
    lower === 'invalid email or password'
  ) {
    return 'E-mail ou senha incorretos. Confira os dados ou use "Esqueci minha senha".';
  }

  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Verifique a caixa de entrada e o spam.';
  }

  // Cadastro
  if (
    lower.includes('user already registered') ||
    lower.includes('already been registered') ||
    lower.includes('already exists')
  ) {
    return 'Este e-mail já está cadastrado. Tente entrar ou use outro e-mail.';
  }

  if (lower.includes('invalid email')) {
    return 'Informe um e-mail válido.';
  }

  if (lower.includes('password') && lower.includes('least')) {
    return 'A senha não atende ao tamanho mínimo exigido.';
  }

  // Limite / servidor
  if (lower.includes('rate limit') || lower.includes('too many') || lower.includes('429')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }

  if (lower.includes('service') && lower.includes('unavailable')) {
    return `Serviço temporariamente indisponível. ${SUPPORT_HINT}`;
  }

  // OAuth
  if (lower.includes('provider') && (lower.includes('not enabled') || lower.includes('disabled'))) {
    return 'Login com este provedor não está disponível no momento. Use e-mail e senha ou fale com o suporte.';
  }

  // Se parecer mensagem técnica em inglês, não mostrar crua
  const looksTechnical =
    lower.includes('fetch') ||
    lower.includes('neon') ||
    lower.includes('json') ||
    lower.includes('cors');

  if (looksTechnical) {
    return `Não foi possível completar a ação. ${SUPPORT_HINT}`;
  }

  return trimmed;
}
