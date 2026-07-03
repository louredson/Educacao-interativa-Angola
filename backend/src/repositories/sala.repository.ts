import { pool } from '../config/database.js'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

export type SalaRow = RowDataPacket & {
  id: number
  titulo: string
  descricao: string | null
  criador_id: number
  so_membros_comentam: number
  criado_em: string
}

export type MensagemRow = RowDataPacket & {
  id: number
  sala_discussao_id: number
  autor_id: number
  autor_nome: string
  mensagem: string
  criado_em: string
}

export const sala_discussaoRepository = {
  async findByMembro(userId: number): Promise<SalaRow[]> {
    const [rows] = await pool.query<SalaRow[]>(
      `SELECT s.* FROM sala_discussao s
       JOIN sala_discussao_membro sm ON sm.sala_discussao_id = s.id
       WHERE sm.utilizador_id = ?
       ORDER BY s.criado_em DESC`,
      [userId],
    )
    return rows
  },

  async findById(id: number): Promise<SalaRow | null> {
    const [rows] = await pool.query<SalaRow[]>(
      'SELECT * FROM sala_discussao WHERE id = ? LIMIT 1',
      [id],
    )
    return rows[0] ?? null
  },

  async isMembro(sala_discussaoId: number, userId: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT 1 FROM sala_discussao_membro WHERE sala_discussao_id = ? AND utilizador_id = ? LIMIT 1',
      [sala_discussaoId, userId],
    )
    return rows.length > 0
  },

  async getMensagens(sala_discussaoId: number, limit = 100): Promise<MensagemRow[]> {
    const [rows] = await pool.query<MensagemRow[]>(
      `SELECT m.id, m.sala_discussao_id, m.autor_id, u.nome AS autor_nome, m.mensagem, m.criado_em
       FROM mensagem_sala_discussao m
       JOIN utilizador u ON u.id = m.autor_id
       WHERE m.sala_discussao_id = ?
       ORDER BY m.criado_em DESC
       LIMIT ?`,
      [sala_discussaoId, limit],
    )
    return rows
  },

  async addMensagem(sala_discussaoId: number, autorId: number, mensagem: string): Promise<MensagemRow> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO mensagem_sala_discussao (sala_discussao_id, autor_id, mensagem) VALUES (?, ?, ?)',
      [sala_discussaoId, autorId, mensagem],
    )
    const [rows] = await pool.query<MensagemRow[]>(
      `SELECT m.id, m.sala_discussao_id, m.autor_id, u.nome AS autor_nome, m.mensagem, m.criado_em
       FROM mensagem_sala_discussao m
       JOIN utilizador u ON u.id = m.autor_id
       WHERE m.id = ?`,
      [result.insertId],
    )
    return rows[0]
  },
}
