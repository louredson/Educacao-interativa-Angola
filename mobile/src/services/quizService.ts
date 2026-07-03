import { apiRequest } from './api'

// Quizzes e ranking global.

export interface QuizRaw {
  id: number
  titulo: string
  descricao: string | null
  categoria: string | null
}

export interface RankingRaw {
  id: number
  nome: string
  provincia: string | null
  avatar_url?: string | null
  tipo?: string
  pontuacao_total: number
  quizzes_completados: number
}

export interface PerguntaRaw {
  id: number
  pergunta: string
  opcao_a: string
  opcao_b: string
  opcao_c: string
  opcao_d: string
  // Disponível para todos os utilizadores autenticados (não só staff) —
  // é o que permite o feedback imediato verde/vermelho ao responder.
  resposta_correta?: number
  explicacao?: string | null
}

export interface ResultadoPergunta {
  pergunta_id: number
  resposta_escolhida: number
  resposta_correta: number
  correta: boolean
}

export interface ResultadoAttempt {
  total: number
  acertos: number
  percentual: number
  resultados: ResultadoPergunta[]
}

// NOTA: tal como na web, este pedido exige sessão válida (o backend usa o
// middleware `authenticate`, não `authenticateOptional`) — não passar
// `anonymous: true` aqui, ou o pedido falha sempre com 401.
export function listQuizzes() {
  return apiRequest<QuizRaw[]>('/quizzes')
}

export function getRanking() {
  return apiRequest<RankingRaw[]>('/ranking')
}

export function getQuiz(id: number) {
  return apiRequest<{ perguntas: PerguntaRaw[] }>(`/quizzes/${id}`)
}

export function submitQuizAttempt(
  id: number,
  respostas: { pergunta_id: number; resposta_escolhida: number }[],
) {
  return apiRequest<ResultadoAttempt>(`/quizzes/${id}/attempt`, {
    method: 'POST',
    json: { respostas },
  })
}
