import { apiRequest } from './api'

export interface NotificacaoRaw {
  id: number
  tipo: string
  entidade_id: number | null
  titulo: string | null
  mensagem: string
  link_destino: string | null
  lida: boolean | number
  criada_em: string
}

export function listNotifications() {
  return apiRequest<{ notificacoes: NotificacaoRaw[]; nao_lidas: number }>('/notificacoes')
}

export function markAllRead() {
  return apiRequest('/notificacoes/ler-todas', { method: 'PATCH' })
}

export function markRead(id: number) {
  return apiRequest(`/notificacoes/${id}/ler`, { method: 'PATCH' })
}
