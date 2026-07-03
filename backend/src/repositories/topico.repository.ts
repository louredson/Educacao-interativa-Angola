import { pool } from '../config/database.js'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

export type TopicoRow = RowDataPacket & {
  id: number
  titulo: string
  descricao: string
  criado_por: number
  tipo_privacidade: 'publico' | 'privado'
  categoria: string | null
  tags: string | null
  requires_access: number
  fixado: number
  resolvido: number
  resposta_aceite_id: number | null
  likes: number
  votos: number
  respostas: number
  visualizacoes: number
  criado_em: string
  ultima_atividade: string
}

export type ListOptions = {
  categoria?: string
  sort?: string
  q?: string
  userId?: number | null
}

export const topicoRepository = {
  async findAll(opts: ListOptions = {}): Promise<RowDataPacket[]> {
    const { categoria, sort = 'recentes', q, userId } = opts
    const params: unknown[] = []

    let meuVotoSel  = ''
    let meuVotoJoin = ''
    if (userId) {
      meuVotoSel  = ', vt.valor AS meu_voto'
      meuVotoJoin = 'LEFT JOIN voto_topico vt ON vt.topico_id = t.id AND vt.utilizador_id = ?'
      params.push(userId)
    }

    const where: string[] = []
    if (categoria && !['all', 'todas', 'todos'].includes(categoria.toLowerCase())) {
      where.push('t.categoria = ?'); params.push(categoria)
    }
    if (q) {
      where.push('(t.titulo LIKE ? OR t.descricao LIKE ?)'); params.push(`%${q}%`, `%${q}%`)
    }
    if (sort === 'sem-resposta') where.push('t.respostas = 0')
    if (sort === 'resolvidos')   where.push('t.resolvido = 1')

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const orderMap: Record<string, string> = {
      populares:      't.votos DESC, t.criado_em DESC, t.id DESC',
      recentes:       't.criado_em DESC, t.id DESC',
      'sem-resposta': 't.criado_em DESC, t.id DESC',
      resolvidos:     't.ultima_atividade DESC, t.id DESC',
    }
    const orderBy = orderMap[sort] ?? 't.ultima_atividade DESC, t.id DESC'

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.id, t.titulo, t.descricao, t.criado_por, t.tipo_privacidade, t.categoria, t.tags,
              t.requires_access, t.fixado, t.resolvido, t.resposta_aceite_id,
              t.likes, t.votos, t.respostas, t.visualizacoes, t.criado_em, t.ultima_atividade,
              u.nome AS autor_nome, u.avatar_url AS autor_avatar, u.tipo AS autor_tipo${meuVotoSel}
       FROM topico_forum t
       JOIN utilizador u ON u.id = t.criado_por
       ${meuVotoJoin}
       ${whereClause}
       ORDER BY t.fixado DESC, ${orderBy}`,
      params,
    )
    return rows
  },

  async findById(id: number, userId?: number | null): Promise<RowDataPacket | null> {
    const params: unknown[] = [id]
    let meuVotoSel  = ''
    let meuVotoJoin = ''
    if (userId) {
      meuVotoSel  = ', vt.valor AS meu_voto'
      meuVotoJoin = 'LEFT JOIN voto_topico vt ON vt.topico_id = t.id AND vt.utilizador_id = ?'
      params.unshift(userId)
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.*, u.nome AS autor_nome, u.avatar_url AS autor_avatar, u.tipo AS autor_tipo${meuVotoSel}
       FROM topico_forum t
       JOIN utilizador u ON u.id = t.criado_por
       ${meuVotoJoin}
       WHERE t.id = ?
       LIMIT 1`,
      params,
    )
    return rows[0] ?? null
  },

  async create(data: {
    titulo: string
    descricao: string
    criadoPor: number
    categoria: string | null
    tags: string | null
    tipoPrivacidade: 'publico' | 'privado'
    requiresAccess: boolean
  }): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO topico_forum
         (titulo, descricao, criado_por, categoria, tags, tipo_privacidade, requires_access)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.titulo, data.descricao, data.criadoPor, data.categoria, data.tags,
       data.tipoPrivacidade, data.requiresAccess ? 1 : 0],
    )
    return result.insertId
  },

  async delete(id: number): Promise<void> {
    await pool.query<ResultSetHeader>('DELETE FROM topico_forum WHERE id = ?', [id])
  },

  async incrementViews(id: number): Promise<void> {
    await pool.query(
      'UPDATE topico_forum SET visualizacoes = COALESCE(visualizacoes, 0) + 1, ultima_atividade = NOW() WHERE id = ?',
      [id],
    )
  },
}
