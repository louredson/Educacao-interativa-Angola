import { apiRequest } from './api'

// Fórum de discussão: tópicos e respostas.

export interface TopicoRaw {
  id: number
  titulo: string
  descricao: string
  categoria: string | null
  autor_nome: string
  autor_avatar?: string | null
  votos: number
  meu_voto?: number | null
  respostas: number
  resolvido?: number
}

export function listTopicos() {
  return apiRequest<TopicoRaw[]>('/topicos')
}

export function getTopico(id: number) {
  return apiRequest<any>(`/topicos/${id}`)
}

export function votarTopico(id: number, valor: 1 | -1) {
  return apiRequest<{ votos: number; meu_voto: number }>(`/topicos/${id}/votar`, {
    method: 'POST',
    json: { valor },
  })
}

export function criarTopico(titulo: string, descricao: string, categoria = 'Economia') {
  return apiRequest('/topicos', {
    method: 'POST',
    json: { titulo, descricao, categoria },
  })
}

export function responderTopico(id: number, conteudo: string) {
  return apiRequest(`/topicos/${id}/respostas`, {
    method: 'POST',
    json: { conteudo },
  })
}
