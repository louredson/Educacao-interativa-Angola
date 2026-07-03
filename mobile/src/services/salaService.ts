import { apiRequest } from './api'

// Salas de discussão (chat em grupo) e convites. Equivalente ao
// "chatService" pedido na especificação.

export interface SalaRaw {
  id: number
  titulo: string
  descricao: string | null
  criador_id: number
  so_membros_comentam: number
  criado_em: string
}

export interface MensagemRaw {
  id: number
  sala_id?: number
  autor_id: number
  autor_nome: string
  autor_avatar?: string | null
  mensagem: string
  criado_em: string
}

export function listSalas() {
  return apiRequest<{ salas: SalaRaw[] }>('/salas')
}

export function getMensagens(salaId: number) {
  return apiRequest<{ mensagens: MensagemRaw[] }>(`/salas/${salaId}/mensagens`)
}

export function enviarMensagem(salaId: number, mensagem: string) {
  return apiRequest<{ mensagem: MensagemRaw }>(`/salas/${salaId}/mensagens`, {
    method: 'POST',
    json: { mensagem },
  })
}

export function usarCodigoConvite(codigo: string) {
  return apiRequest('/convites/usar', { method: 'POST', json: { codigo } })
}
