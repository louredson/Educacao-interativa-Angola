// Bounded Context: Quiz / Avaliação
// Agregados: Quiz, Pergunta, Tentativa
// Responsabilidade: avaliação de conhecimentos, progresso, ranking

export interface Quiz {
  id: number
  titulo: string
  descricao: string | null
  categoria: string | null
  criadoPor: number
  criadoEm: Date
}

export interface Pergunta {
  id: number
  quizId: number
  texto: string
  opcoes: string[]
  respostaCorreta: number
  pontos: number
}

export interface Tentativa {
  id: number
  quizId: number
  utilizadorId: number
  pontuacao: number
  total: number
  completado: boolean
  iniciadaEm: Date
  completadaEm: Date | null
}
