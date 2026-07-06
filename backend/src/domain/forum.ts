// Bounded Context: Fórum
// Agregados: Topico, Resposta, Voto
// Responsabilidade: discussão pública/privada, moderação, votação

export type TipoPrivacidade = 'publico' | 'privado'

export interface Topico {
  id: number
  titulo: string
  descricao: string
  criadoPor: number
  categoria: string | null
  tags: string | null
  tipoPrivacidade: TipoPrivacidade
  requiresAccess: boolean
  fixado: boolean
  resolvido: boolean
  respostaAceiteId: number | null
  votos: number
  respostas: number
  visualizacoes: number
  criadoEm: Date
  ultimaAtividade: Date
}

export interface Resposta {
  id: number
  topicoId: number
  criadaPor: number
  conteudo: string
  aceite: boolean
  votos: number
  criadaEm: Date
}

export interface VotoTopico {
  utilizadorId: number
  topicoId: number
  valor: 1 | -1
}
