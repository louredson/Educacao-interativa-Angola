import jwt from 'jsonwebtoken'
import { env } from './env.js'

export interface JwtPayload {
  userId: number
  email:  string
  role:   string
}

/** Gera um token JWT assinado com as claims do utilizador. */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions)
}

/** Verifica e devolve as claims do token; lança erro se inválido ou expirado. */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload
}
