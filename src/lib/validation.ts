// Validação de senha forte
export interface PasswordStrength {
  score: number; // 0-4
  label: 'Fraca' | 'Regular' | 'Boa' | 'Forte';
  checks: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
  valid: boolean;
}

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export function validatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: SPECIAL_CHARS.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const score = Math.min(4, passed);

  const labels: PasswordStrength['label'][] = ['Fraca', 'Regular', 'Boa', 'Forte', 'Forte'];
  const valid = Object.values(checks).every(Boolean);

  return {
    score,
    label: labels[Math.min(score, 4)] || 'Fraca',
    checks,
    valid,
  };
}

// Remove máscara do CPF (apenas números)
export function unmaskCpf(value: string): string {
  return value.replace(/\D/g, '');
}

// Aplica máscara no CPF (XXX.XXX.XXX-XX)
export function maskCpf(value: string): string {
  const numbers = unmaskCpf(value).slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Valida CPF (algoritmo oficial da Receita Federal)
export function validateCpf(cpf: string): boolean {
  const numbers = unmaskCpf(cpf);
  if (numbers.length !== 11) return false;

  // Rejeita CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;

  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(numbers[9])) return false;

  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(numbers[10])) return false;

  return true;
}

// Valida nome completo (mínimo 2 palavras, sem números)
export function validateFullName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 3) return false;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;
  if (/\d/.test(trimmed)) return false;
  return true;
}
