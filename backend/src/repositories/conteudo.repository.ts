import { pool } from '../config/database.js'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

export type ConteudoRow = RowDataPacket & {
  id: string
  titulo: string
  descricao: string | null
  conteudo_completo: string | null
  tipo: 'video' | 'texto_normal' | 'texto_jindungo' | 'podcast'
  categoria: string | null
  tema: string | null
  duracao: string | null
  url_recurso: string | null
  recurso_filename: string | null
  imagem_filename: string | null
  video_filename: string | null
  apresentador: string | null
  categoria_podcast: string | null
  cache_offline: number
  publicado_por: number | null
  publicado_em: string
}

export const conteudoRepository = {
  async findAll(): Promise<ConteudoRow[]> {
    const [rows] = await pool.query<ConteudoRow[]>(
      'SELECT * FROM conteudo ORDER BY publicado_em DESC, id DESC',
    )
    return rows
  },

  async findById(id: string): Promise<ConteudoRow | null> {
    const [rows] = await pool.query<ConteudoRow[]>(
      'SELECT * FROM conteudo WHERE id = ? LIMIT 1',
      [id],
    )
    return rows[0] ?? null
  },

  async create(data: {
    titulo: string
    descricao: string | null
    tipo: string
    categoria: string | null
    tema: string | null
    duracao: string | null
    conteudoCompleto: string | null
    urlRecurso: string | null
    recursoFilename: string | null
    imagemFilename: string | null
    videoFilename: string | null
    apresentador: string | null
    categoriaPodcast: string | null
    cacheOffline: boolean
    publicadoPor: number | null
  }): Promise<ConteudoRow> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO conteudo
         (titulo, descricao, conteudo_completo, tipo, categoria, tema, duracao, url_recurso,
          recurso_filename, imagem_filename, video_filename, apresentador, categoria_podcast,
          cache_offline, publicado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.titulo, data.descricao, data.conteudoCompleto, data.tipo, data.categoria,
        data.tema, data.duracao, data.urlRecurso, data.recursoFilename, data.imagemFilename,
        data.videoFilename, data.apresentador, data.categoriaPodcast,
        data.cacheOffline ? 1 : 0, data.publicadoPor,
      ],
    )
    const row = await this.findById(String(result.insertId))
    return row!
  },

  async update(id: string, data: Partial<{
    titulo: string
    descricao: string | null
    conteudoCompleto: string | null
    duracao: string | null
    imagemFilename: string | null
    cacheOffline: boolean
  }>): Promise<void> {
    const fields: string[] = []
    const values: unknown[] = []

    if (data.titulo !== undefined)           { fields.push('titulo = ?');             values.push(data.titulo) }
    if (data.descricao !== undefined)        { fields.push('descricao = ?');          values.push(data.descricao) }
    if (data.conteudoCompleto !== undefined) { fields.push('conteudo_completo = ?');  values.push(data.conteudoCompleto) }
    if (data.duracao !== undefined)          { fields.push('duracao = ?');            values.push(data.duracao) }
    if (data.imagemFilename !== undefined)   { fields.push('imagem_filename = ?');    values.push(data.imagemFilename) }
    if (data.cacheOffline !== undefined)     { fields.push('cache_offline = ?');      values.push(data.cacheOffline ? 1 : 0) }

    if (fields.length === 0) return
    values.push(id)
    await pool.query(`UPDATE conteudo SET ${fields.join(', ')} WHERE id = ?`, values)
  },

  async delete(id: string): Promise<void> {
    await pool.query<ResultSetHeader>('DELETE FROM conteudo WHERE id = ?', [id])
  },

  async incrementViews(id: string): Promise<void> {
    await pool.query('UPDATE conteudo SET visualizacoes = COALESCE(visualizacoes, 0) + 1 WHERE id = ?', [id])
  },
}
