import type { Request, Response, NextFunction } from 'express'
import { getAuthenticatedUser } from '../utils/session.js'

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return res.status(401).json({ message: 'Não autenticado' })
  }

  if (user.tipo !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado' })
  }

  next()
}
