import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../config/database.js'
import { env } from '../config/env.js'
import { toPublicUser, type UserRecord } from '../types/user.js'
import { createResetToken, hashToken, signJwt } from '../utils/jwt.js'
import { getAuthenticatedUser } from '../utils/session.js'

async function findUserByEmail(email: string) {
  const [rows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE email = ? LIMIT 1',
    [email],
  )
  return rows[0] ?? null
}

function createAccessToken(user: UserRecord) {
  return signJwt({
    sub: String(user.id),
    email: user.email,
    role: user.tipo,
    name: user.nome,
  })
}

function buildAuthResponse(user: UserRecord) {
  return {
    user: toPublicUser(user),
    accessToken: createAccessToken(user),
  }
}

export async function register(req: Request, res: Response) {
  const {
    name,
    email,
    password,
    province = 'Luanda',
    telemovel = null,
    institution = null,
    course = null,
  } = req.body ?? {}

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email e password são obrigatórios' })
  }

  const existing = await findUserByEmail(email)
  if (existing) {
    return res.status(409).json({ message: 'Email já registado' })
  }

  const senhaHash = await bcrypt.hash(String(password), 10)

  const [result] = await pool.query(
    `INSERT INTO utilizador
      (nome, email, senha_hash, telemovel, provincia, instituicao, curso, tipo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, email, senhaHash, telemovel, province, institution, course, 'subscrito'],
  )

  const insertId = (result as { insertId: number }).insertId
  const [rows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE id = ? LIMIT 1',
    [insertId],
  )

  const user = rows[0]
  if (!user) {
    return res.status(500).json({ message: 'Falha ao criar utilizador' })
  }

  return res.status(201).json(buildAuthResponse(user))
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {}

  if (!email || !password) {
    return res.status(400).json({ message: 'email e password são obrigatórios' })
  }

  const user = await findUserByEmail(email)
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' })
  }

  const valid = await bcrypt.compare(String(password), user.senha_hash)
  if (!valid) {
    return res.status(401).json({ message: 'Credenciais inválidas' })
  }

  await pool.query('UPDATE utilizador SET ultimo_acesso = NOW() WHERE id = ?', [user.id])

  const [freshRows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE id = ? LIMIT 1',
    [user.id],
  )

  const freshUser = freshRows[0] ?? user
  return res.json(buildAuthResponse(freshUser))
}

export async function me(req: Request, res: Response) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return res.status(401).json({ message: 'Não autenticado' })
  }

  return res.json({ user: toPublicUser(user) })
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body ?? {}
  if (!email) {
    return res.status(400).json({ message: 'email é obrigatório' })
  }

  const user = await findUserByEmail(email)
  if (!user) {
    return res.status(404).json({ message: 'Utilizador não encontrado' })
  }

  const { rawToken, hashedToken } = createResetToken()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30)

  await pool.query(
    'UPDATE utilizador SET token_reset = ?, token_reset_expira = ? WHERE id = ?',
    [hashedToken, expiresAt, user.id],
  )

  return res.json({
    message: 'Se o email existir, um token de recuperação foi gerado.',
    resetToken: env.nodeEnv === 'production' ? undefined : rawToken,
  })
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body ?? {}
  if (!token || !password) {
    return res.status(400).json({ message: 'token e password são obrigatórios' })
  }

  const hashedToken = hashToken(String(token))
  const [rows] = await pool.query<UserRecord[]>(
    `SELECT * FROM utilizador
     WHERE token_reset = ? AND token_reset_expira > NOW()
     LIMIT 1`,
    [hashedToken],
  )

  const user = rows[0]
  if (!user) {
    return res.status(400).json({ message: 'Token inválido ou expirado' })
  }

  const senhaHash = await bcrypt.hash(String(password), 10)
  await pool.query(
    `UPDATE utilizador
     SET senha_hash = ?, token_reset = NULL, token_reset_expira = NULL
     WHERE id = ?`,
    [senhaHash, user.id],
  )

  return res.json({ message: 'Senha atualizada com sucesso' })
}
