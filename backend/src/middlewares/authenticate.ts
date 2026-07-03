import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../config/jwt.js'
import { pool } from '../config/database.js'
import type { UserRecord } from '../types/index.js'

/**
 * Middleware de autenticação JWT.
 * Lê o header Authorization: Bearer <token>, verifica a assinatura
 * e coloca req.user com as claims.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autenticação em falta.' })
  }

  const token = header.slice(7)
  try {
    const payload = verifyToken(token)

    // Verifica se o utilizador ainda existe e está activo
    const [rows] = await pool.query<UserRecord[]>(
      'SELECT id, tipo, ativo FROM utilizador WHERE id = ? LIMIT 1',
      [payload.userId],
    )
    const user = rows[0]
    if (!user || !user.ativo) {
      return res.status(401).json({ message: 'Conta inactiva ou inexistente.' })
    }

    req.user = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado.' })
  }
}

/** Variante: só autentica se houver token; caso contrário prossegue como visitante. */
export async function authenticateOptional(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return next()

  try {
    req.user = verifyToken(header.slice(7))
  } catch {
    // token inválido — prossegue como anónimo
  }
  next()
}
