import type { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'
import bcrypt from 'bcryptjs'
import { pool } from '../config/database.js'
import { toPublicUser, type UserRecord } from '../types/index.js'

// ── GET /api/perfil ────────────────────────────────────────────────────────────
export async function getMyProfile(req: Request, res: Response) {
  const userId = req.user!.userId

  const [rows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE id = ? LIMIT 1',
    [userId],
  )
  const user = rows[0]
  if (!user) return res.status(404).json({ message: 'Utilizador não encontrado.' })

  // Estatísticas agregadas
  const [stats] = await pool.query<RowDataPacket[]>(
    `SELECT
       (SELECT COUNT(*) FROM progresso_utilizador WHERE subscrito_id = ?) AS conteudos_lidos,
       (SELECT COUNT(*) FROM resposta_quiz_usuario  WHERE usuario_id  = ?) AS quizzes_feitos,
       (SELECT COUNT(*) FROM resposta_forum          WHERE autor_id    = ?) AS respostas_forum,
       (SELECT COUNT(*) FROM conteudo_salvo          WHERE subscrito_id = ?) AS favoritos,
       (SELECT COALESCE(SUM(percentual_acerto),0) FROM resposta_quiz_usuario WHERE usuario_id = ?) AS pontuacao_total`,
    [userId, userId, userId, userId, userId],
  )

  return res.json({ ...toPublicUser(user), stats: stats[0] })
}

// ── GET /api/perfil/:id (público) ─────────────────────────────────────────────
export async function getPublicProfile(req: Request, res: Response) {
  const [rows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE id = ? AND ativo = 1 LIMIT 1',
    [req.params.id],
  )
  const user = rows[0]
  if (!user) return res.status(404).json({ message: 'Perfil não encontrado.' })

  const [stats] = await pool.query<RowDataPacket[]>(
    `SELECT
       (SELECT COUNT(*) FROM progresso_utilizador WHERE subscrito_id = ?) AS conteudos_lidos,
       (SELECT COUNT(*) FROM resposta_quiz_usuario  WHERE usuario_id  = ?) AS quizzes_feitos,
       (SELECT COALESCE(SUM(percentual_acerto),0)   FROM resposta_quiz_usuario WHERE usuario_id = ?) AS pontuacao_total`,
    [user.id, user.id, user.id],
  )

  return res.json({ ...toPublicUser(user), stats: stats[0] })
}

// ── PUT /api/perfil ───────────────────────────────────────────────────────────
export async function updateMyProfile(req: Request, res: Response) {
  const userId  = req.user!.userId
  const allowed = ['nome', 'telemovel', 'provincia', 'instituicao', 'curso', 'avatar_url'] as const
  const { password } = req.body ?? {}

  const updates: string[] = []
  const values:  unknown[] = []

  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updates.push(`${field} = ?`)
      values.push(req.body[field])
    }
  }

  // Trocar password voluntariamente
  if (password) {
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'A nova senha deve ter pelo menos 8 caracteres.' })
    }
    updates.push('senha_hash = ?')
    values.push(await bcrypt.hash(String(password), 10))
  }

  if (!updates.length) return res.status(400).json({ message: 'Nenhum campo para actualizar.' })

  values.push(userId)
  await pool.query(`UPDATE utilizador SET ${updates.join(', ')} WHERE id = ?`, values)

  const [rows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE id = ? LIMIT 1',
    [userId],
  )
  return res.json(toPublicUser(rows[0]!))
}
