import type { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'
import { pool } from '../config/database.js'

// ── GET /api/stats ─────────────────────────────────────────────────────────────
// Estatísticas públicas da plataforma — sem autenticação necessária
export async function getPublicStats(_req: Request, res: Response) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        (SELECT COUNT(*) FROM conteudo)         AS total_conteudos,
        (SELECT COUNT(*) FROM quiz_pergunta)    AS total_perguntas_quiz,
        (SELECT COUNT(*) FROM topico_forum)     AS total_topicos,
        (SELECT COUNT(*) FROM utilizador WHERE ativo = 1) AS total_utilizadores
    `)
    res.json(rows[0])
  } catch {
    res.status(500).json({ error: 'Erro ao obter estatísticas' })
  }
}
