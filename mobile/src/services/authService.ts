import { apiRequest } from './api'

// Chamadas relacionadas com autenticação. O estado de sessão em si
// (token, utilizador em memória, restauro ao abrir a app) vive no
// AuthContext — este ficheiro só sabe falar com o backend.

export type RawUser = Record<string, unknown>

export function login(email: string, password: string) {
  return apiRequest<{ token: string; user: RawUser }>('/auth/login', {
    method: 'POST',
    anonymous: true,
    json: { email, password },
  })
}

export interface DadosRegisto {
  name: string
  email: string
  password: string
  province?: string
  institution?: string
  course?: string
}

export function register(dados: DadosRegisto) {
  return apiRequest<{ token: string; user: RawUser }>('/auth/register', {
    method: 'POST',
    anonymous: true,
    json: dados,
  })
}

export function logout() {
  return apiRequest('/auth/logout', { method: 'POST' })
}

/**
 * Pede o envio do email de recuperação de password. O link recebido por
 * email abre a página web de redefinição — o mobile não tem uma tela própria
 * para o passo final porque isso exigiria configurar deep links; abrir o
 * link no browser do telemóvel funciona perfeitamente e evita essa
 * complexidade extra.
 */
export function forgotPassword(email: string) {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    anonymous: true,
    json: { email },
  })
}

export function me() {
  return apiRequest<{ user: RawUser }>('/auth/me')
}
