import type { Request, Response, NextFunction } from 'express'

type UserType = 'visitante' | 'subscrito' | 'professor' | 'admin' | 'superadmin'

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

/** Atalho: admins e superadmins. */
export const requireAdmin = requireRole('admin', 'superadmin')

/** Atalho: qualquer utilizador autenticado (subscrito, professor, admin, superadmin). */
export const requireAuth = requireRole('subscrito', 'professor', 'admin', 'superadmin')

/** Atalho: professores, admins e superadmins. */
export const requireProfessorOuAdmin = requireRole('professor', 'admin', 'superadmin')

/**
 * Atalho: só professores. Usado para criar/gerir conteúdos — o admin deixou
 * de publicar conteúdo, faz apenas a administração do sistema (utilizadores,
 * criação de professores, moderação de comentários denunciados).
 */
export const requireProfessor = requireRole('professor')
