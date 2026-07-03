import crypto from 'crypto'
import type { RowDataPacket } from 'mysql2'
import { pool } from '../config/database.js'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface PasswordResetRecord extends RowDataPacket {
  id:         number
  user_id:    number
  token:      string
  expires_at: Date
  used:       number
  created_at: Date
}

// ── Helpers internos ──────────────────────────────────────────────────────────

/** Gera token seguro de 64 hex chars e persiste na BD.
 *  Invalida todos os tokens anteriores do mesmo utilizador. */
export async function criarTokenReset(userId: number): Promise<string> {
  // Remove tokens antigos do mesmo utilizador (um utilizador = um token activo)
  await pool.query('DELETE FROM password_resets WHERE user_id = ?', [userId])

  const token    = crypto.randomBytes(32).toString('hex') // 64 hex chars
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)  // 1 hora

  await pool.query(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt],
  )

  return token
}

/** Devolve o registo se o token for válido, não usado e não expirado.
 *  Devolve null em qualquer outro caso. */
export async function encontrarTokenValido(
  token: string,
): Promise<PasswordResetRecord | null> {
  const [rows] = await pool.query<PasswordResetRecord[]>(
    `SELECT * FROM password_resets
     WHERE token = ? AND expires_at > NOW() AND used = 0
     LIMIT 1`,
    [token.trim()],
  )
  return rows[0] ?? null
}

/** Marca o token como usado após a senha ser redefinida com sucesso. */
export async function marcarTokenUsado(id: number): Promise<void> {
  await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [id])
}

/** Remove todos os tokens de reset de um utilizador (ex: após login bem-sucedido). */
export async function limparTokensReset(userId: number): Promise<void> {
  await pool.query('DELETE FROM password_resets WHERE user_id = ?', [userId])
}
