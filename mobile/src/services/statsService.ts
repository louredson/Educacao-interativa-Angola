import { apiRequest } from './api'

export interface Stats {
  total_conteudos: number
  total_perguntas_quiz: number
  total_topicos: number
  total_utilizadores: number
}

export function getStats() {
  return apiRequest<Stats>('/stats', { anonymous: true })
}
