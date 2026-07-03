// Bounded Context: Conteúdo
// Agregados: Conteudo, Episodio, SolicitacaoAcesso
// Responsabilidade: publicação, acesso premium, visualizações

export type TipoConteudo = 'video' | 'texto_normal' | 'texto_jindungo' | 'podcast'

export interface Conteudo {
  id: string
  titulo: string
  descricao: string | null
  tipo: TipoConteudo
  categoria: string | null
  tema: string | null
  duracao: string | null
  publicadoPor: number | null
  publicadoEm: Date
  cacheOffline: boolean
  urlRecurso: string | null
  imagemFilename: string | null
}

export interface Episodio {
  id: number
  conteudoId: string
  titulo: string
  duracao: string | null
  audioUrl: string | null
  descricao: string | null
}

export type StatusAcesso = 'pendente' | 'aprovado' | 'rejeitado'

export interface SolicitacaoAcesso {
  id: number
  subscriboId: number
  conteudoId: string
  status: StatusAcesso
  motivo: string | null
  criadoEm: Date
  resolvidoEm: Date | null
}
