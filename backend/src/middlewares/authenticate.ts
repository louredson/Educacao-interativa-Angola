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
    if (!user) {
      return res.status(401).json({ message: 'Conta inexistente.' })
    }
    // Conta suspensa: 403 (e não 401) para o frontend NÃO limpar a sessão —
    // assim consegue mostrar a tela "Conta suspensa" em vez de expulsar
    // silenciosamente para o login.
    if (!user.ativo) {
      return res.status(403).json({ message: 'Conta suspensa.', code: 'CONTA_SUSPENSA' })
    }

    req.user = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado.' })
  }
}

/**
 * Variante usada apenas em /auth/me: autentica mesmo que a conta esteja
 * suspensa, para o frontend poder ler `ativo = 0` e mostrar a tela de
 * bloqueio "Conta suspensa" com o botão de terminar sessão.
 */
export async function authenticateAllowInactive(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autenticação em falta.' })
  }

  try {
    const payload = verifyToken(header.slice(7))

    const [rows] = await pool.query<UserRecord[]>(
      'SELECT id FROM utilizador WHERE id = ? LIMIT 1',
      [payload.userId],
    )
    if (!rows[0]) {
      return res.status(401).json({ message: 'Conta inexistente.' })
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
