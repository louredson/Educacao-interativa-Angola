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

// ── POST /api/perfil/change-password ─────────────────────────────────────────
export async function changePassword(req: Request, res: Response) {
  const userId = req.user!.userId
  const { senhaAtual, novaSenha } = req.body ?? {}

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ message: 'Campos obrigatórios em falta.' })
  }
  if (String(novaSenha).length < 8) {
    return res.status(400).json({ message: 'A nova senha deve ter pelo menos 8 caracteres.' })
  }

  const [rows] = await pool.query<UserRecord[]>(
    'SELECT senha_hash FROM utilizador WHERE id = ? LIMIT 1', [userId],
  )
  if (!rows[0]) return res.status(404).json({ message: 'Utilizador não encontrado.' })

  const ok = await bcrypt.compare(String(senhaAtual), rows[0].senha_hash ?? '')
  if (!ok) return res.status(401).json({ message: 'A senha actual está incorrecta.' })

  await pool.query(
    'UPDATE utilizador SET senha_hash = ? WHERE id = ?',
    [await bcrypt.hash(String(novaSenha), 10), userId],
  )
  return res.json({ message: 'Senha alterada com sucesso.' })
}

// ── POST /api/perfil/avatar ───────────────────────────────────────────────────
// Recebe uma imagem (multipart/form-data, campo "avatar"), guarda-a em
// /uploads/avatars e associa o URL resultante ao utilizador autenticado.
// Devolve o utilizador actualizado (mesmo formato que os outros endpoints de
// perfil), para que o cliente possa atualizar o estado local de imediato.
export async function uploadMyAvatar(req: Request, res: Response) {
  const userId = req.user!.userId

  if (!req.file) {
    return res.status(400).json({ message: 'Nenhuma imagem enviada.' })
  }

  const avatarUrl = `/uploads/avatars/${req.file.filename}`
  await pool.query('UPDATE utilizador SET avatar_url = ? WHERE id = ?', [avatarUrl, userId])

  const [rows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE id = ? LIMIT 1',
    [userId],
  )
  const user = rows[0]
  if (!user) return res.status(404).json({ message: 'Utilizador não encontrado.' })

  return res.status(201).json(toPublicUser(user))
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
