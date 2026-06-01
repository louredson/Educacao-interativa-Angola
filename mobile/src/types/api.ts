export type UserRole = 'visitante' | 'subscrito' | 'admin'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  province: string | null
  institution: string | null
  course: string | null
  role: UserRole
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
  lastAccess: string | null
  isAdmin: boolean
}

export interface AuthResponse {
  user: User
  accessToken: string
}

export interface ApiEnvelope<T> {
  message?: string
  user?: User
  accessToken?: string
  resetToken?: string
  data?: T
}

export interface ContentItem {
  id: number
  titulo: string
  descricao: string | null
  conteudo_completo: string | null
  tipo: 'video' | 'texto_normal' | 'texto_jindungo' | 'podcast'
  categoria: string | null
  tema: string | null
  duracao: string | null
  url_recurso: string | null
  recurso_filename: string | null
  imagem_filename: string | null
  video_filename: string | null
  apresentador: string | null
  categoria_podcast: string | null
  cache_offline: number | boolean
  publicado_por: number | null
  publicado_em: string
}

export interface NotificationItem {
  id: number
  usuario_id: number
  tipo: string
  entidade_id: number | null
  titulo: string | null
  mensagem: string
  link_destino: string | null
  lida: 0 | 1
  lida_em: string | null
  criada_em: string
}

