import { describe, expect, it } from 'vitest';
import { mapAuthError } from './authErrors';

describe('mensagens de autenticação', () => {
  it('explica bloqueio de origem sem culpar as credenciais', () => {
    for (const error of [new Error('Invalid origin'), { code: 'INVALID_ORIGIN', message: 'Forbidden' }]) {
      expect(mapAuthError(error)).toContain('endereço ainda não está liberado');
    }
  });
  it('distingue credenciais, verificação e expiração de código', () => {
    expect(mapAuthError(new Error('Invalid email or password'))).toContain('E-mail ou senha incorretos');
    expect(mapAuthError({ message: 'Email not verified' })).toContain('Confirme seu e-mail');
    expect(mapAuthError({ message: 'OTP expired' })).toContain('código expirou');
  });
  it('não mostra erros internos e preserva validações locais', () => {
    expect(mapAuthError({ message: 'Internal server error' })).not.toContain('Internal server error');
    expect(mapAuthError(new TypeError('Failed to fetch'))).toContain('conectar ao servidor');
    expect(mapAuthError(new Error('As senhas não coincidem.'))).toBe('As senhas não coincidem.');
  });
});
