import type { Request, Response, NextFunction } from 'express'

type UserType = 'visitante' | 'subscrito' | 'admin'

/**
 * Factory que devolve um middleware que verifica se req.user.role
 * está incluído nos papéis permitidos.
 * Deve ser usado DEPOIS de authenticate().
 */
export function requireRole(...roles: UserType[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Não autenticado.' })
    }
    if (!roles.includes(req.user.role as UserType)) {
      return res.status(403).json({ message: 'Não tens permissão para realizar esta acção.' })
    }
    next()
  }
}

/** Atalho: apenas admins. */
export const requireAdmin = requireRole('admin')

/** Atalho: admins e subscritores. */
export const requireAuth = requireRole('subscrito', 'admin')
