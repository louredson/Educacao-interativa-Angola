import type { Request, Response } from 'express'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { pool } from '../config/database.js'
import { getAuthenticatedUser } from '../utils/session.js'

type NotificationRow = RowDataPacket & {
  id: number
  usuario_id: number
  tipo: string
  entidade_id: number | null
  titulo: string | null
  mensagem: string
  link_destino: string | null
  lida: 0 | 1
  lida_em: string | null
  criada_em: string
}

export async function listNotifications(req: Request, res: Response) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return res.status(401).json({ message: 'Não autenticado' })
  }

  const limit = Number(req.query.limit ?? 50)
  const [rows] = await pool.query<NotificationRow[]>(
    'SELECT * FROM notificacao WHERE usuario_id = ? ORDER BY criada_em DESC LIMIT ?',
    [user.id, Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 50],
  )

  return res.json(rows)
}

export async function markNotificationAsRead(req: Request, res: Response) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return res.status(401).json({ message: 'Não autenticado' })
  }

  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE notificacao SET lida = 1, lida_em = NOW() WHERE id = ? AND usuario_id = ?',
    [req.params.id, user.id],
  )

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Notificação não encontrada' })
  }

  return res.json({ message: 'Notificação marcada como lida' })
}

export async function markAllNotificationsAsRead(req: Request, res: Response) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return res.status(401).json({ message: 'Não autenticado' })
  }

  await pool.query(
    'UPDATE notificacao SET lida = 1, lida_em = NOW() WHERE usuario_id = ? AND lida = 0',
    [user.id],
  )

  return res.json({ message: 'Notificações marcadas como lidas' })
}
