// Bounded Context: Utilizador
// Agregado raiz: Utilizador
// Responsabilidade: identidade, autenticação, perfil

export type UtilizadorRole = 'visitante' | 'subscrito' | 'professor' | 'admin' | 'superadmin'

export interface Utilizador {
  id: number
  nome: string
  email: string
  role: UtilizadorRole
  ativo: boolean
  provincia: string
  telemovel: string | null
  instituicao: string | null
  curso: string | null
  avatarUrl: string | null
  criadoEm: Date
  ultimoAcesso: Date | null
}

export interface UtilizadorPublico {
  id: number
  nome: string
  email: string
  role: UtilizadorRole
  provincia: string
  avatarUrl: string | null
  criadoEm: Date
}

export interface TokenPayload {
  userId: number
  email: string
  role: UtilizadorRole
}
