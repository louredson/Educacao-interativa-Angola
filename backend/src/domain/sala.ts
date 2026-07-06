// Bounded Context: Sala de Discussão
// Agregados: Sala, Membro, Mensagem, Convite
// Responsabilidade: espaços privados de discussão, convites, permissões

export interface Sala {
  id: number
  titulo: string
  descricao: string | null
  criadorId: number
  soMembrosComentam: boolean
  criadoEm: Date
}

export interface SalaMembro {
  salaId: number
  utilizadorId: number
  podecomentar: boolean
  aprovado: boolean
  entrouEm: Date
}

export interface MensagemSala {
  id: number
  salaId: number
  autorId: number
  mensagem: string
  criadoEm: Date
}

export interface Convite {
  id: number
  salaId: number
  criadoPor: number
  codigo: string
  email: string | null
  usado: boolean
  expiradoEm: Date | null
  criadoEm: Date
}
