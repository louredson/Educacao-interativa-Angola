import type { Request } from 'express'
import { pool } from '../config/database.js'
import type { UserRecord } from '../types/user.js'
import { extractBearerToken, verifyJwt } from './jwt.js'

async function findUserById(id: string) {
  const [rows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE id = ? LIMIT 1',
    [id],
  )
  return rows[0] ?? null
}

async function findUserByEmail(email: string) {
  const [rows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE email = ? LIMIT 1',
    [email],
  )
  return rows[0] ?? null
}

export async function getAuthenticatedUser(req: Request) {
  const token = extractBearerToken(req)
  if (token) {
    try {
      const payload = verifyJwt(token)
      const user = await findUserById(payload.sub)
      if (user) {
        return user
      }
    } catch {
      // Fallback para o modo antigo do frontend web.
    }
  }

  const userId = req.header('x-user-id')
  const userEmail = req.header('x-user-email')

  if (userId) {
    return findUserById(userId)
  }

  if (userEmail) {
    return findUserByEmail(userEmail)
  }

  return null
}
