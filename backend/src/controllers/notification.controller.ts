import type { Request, Response } from 'express'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../config/database.js'

// ── GET /api/notificacoes ─────────────────────────────────────────────────────
export async function listNotificacoes(req: Request, res: Response) {
  const userId  = req.user!.userId
  const limit   = Math.min(Number(req.query['limit']  ?? 30), 100)
  const onlyNew = req.query['nao_lidas'] === '1'

  const where = onlyNew
    ? 'WHERE usuario_id = ? AND lida = 0'
    : 'WHERE usuario_id = ?'

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM notificacao ${where} ORDER BY criada_em DESC LIMIT ?`,
    onlyNew ? [userId, limit] : [userId, limit],
  )

  const [total] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS nao_lidas FROM notificacao WHERE usuario_id = ? AND lida = 0',
    [userId],
  )

  res.json({ notificacoes: rows, nao_lidas: (total as RowDataPacket[])[0]?.['nao_lidas'] ?? 0 })
}

// ── PATCH /api/notificacoes/:id/ler ──────────────────────────────────────────
export async function marcarLida(req: Request, res: Response) {
  const userId = req.user!.userId

  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE notificacao SET lida = 1, lida_em = NOW() WHERE id = ? AND usuario_id = ?',
    [req.params.id, userId],
  )
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Notificação não encontrada.' })
  }
  res.json({ message: 'Notificação marcada como lida.' })
}

// ── PATCH /api/notificacoes/ler-todas ────────────────────────────────────────
export async function marcarTodasLidas(req: Request, res: Response) {
  await pool.query(
    'UPDATE notificacao SET lida = 1, lida_em = NOW() WHERE usuario_id = ? AND lida = 0',
    [req.user!.userId],
  )
  res.json({ message: 'Todas as notificações marcadas como lidas.' })
}

// ── DELETE /api/notificacoes/:id ──────────────────────────────────────────────
export async function deleteNotificacao(req: Request, res: Response) {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM notificacao WHERE id = ? AND usuario_id = ?',
    [req.params.id, req.user!.userId],
  )
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Notificação não encontrada.' })
  }
  res.status(204).send()
}
