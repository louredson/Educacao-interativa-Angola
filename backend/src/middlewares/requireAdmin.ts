import type { Request, Response, NextFunction } from 'express'
import { pool } from '../config/database.js'
import type { UserRecord } from '../types/user.js'

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.header('x-user-id')

  if (!userId) {
    return res.status(401).json({ message: 'Não autenticado' })
  }

  const [rows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE id = ? LIMIT 1',
    [userId],
  )

  const user = rows[0]
  if (!user) {
    return res.status(401).json({ message: 'Utilizador inválido' })
  }

  if (user.tipo !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado' })
  }

  next()
}
