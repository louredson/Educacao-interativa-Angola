import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { pool } from '../config/database.js'
import { signToken } from '../config/jwt.js'
import { toPublicUser, type UserRecord } from '../types/index.js'
import { enviarEmailBoasVindas, enviarEmailRecuperacao } from '../services/email.service.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

async function findByEmail(email: string): Promise<UserRecord | null> {
  const [rows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE email = ? LIMIT 1',
    [email],
  )
  return rows[0] ?? null
}

async function findById(id: number): Promise<UserRecord | null> {
  const [rows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE id = ? LIMIT 1',
    [id],
  )
  return rows[0] ?? null
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
export async function register(req: Request, res: Response) {
  const {
    name,
    email,
    password,
    province    = 'Luanda',
    telemovel   = null,
    institution = null,
    course      = null,
  } = req.body ?? {}

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email e password são obrigatórios.' })
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: 'A password deve ter pelo menos 8 caracteres.' })
  }

  const existing = await findByEmail(String(email).toLowerCase())
  if (existing) return res.status(409).json({ message: 'Email já registado.' })

  const hash    = await bcrypt.hash(String(password), 10)
  const [result] = await pool.query(
    `INSERT INTO utilizador
       (nome, email, senha_hash, telemovel, provincia, instituicao, curso, tipo)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'subscrito')`,
    [name, String(email).toLowerCase(), hash, telemovel, province, institution, course],
  )
  const insertId = (result as { insertId: number }).insertId
  const user     = await findById(insertId)
  if (!user) return res.status(500).json({ message: 'Falha ao criar utilizador.' })

  const token = signToken({ userId: user.id, email: user.email, role: user.tipo })

  // Envia email de boas-vindas de forma não-bloqueante
  enviarEmailBoasVindas(user.nome, user.email).catch(() => null)

  return res.status(201).json({ token, user: toPublicUser(user) })
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {}

  if (!email || !password) {
    return res.status(400).json({ message: 'email e password são obrigatórios.' })
  }

  const user = await findByEmail(String(email).toLowerCase())
  // Mensagem genérica — não revela se o email existe
  if (!user || !user.ativo) {
    return res.status(401).json({ message: 'Credenciais inválidas.' })
  }

  const valid = await bcrypt.compare(String(password), user.senha_hash)
  if (!valid) {
    return res.status(401).json({ message: 'Credenciais inválidas.' })
  }

  await pool.query('UPDATE utilizador SET ultimo_acesso = NOW() WHERE id = ?', [user.id])

  const token = signToken({ userId: user.id, email: user.email, role: user.tipo })
  return res.json({ token, user: toPublicUser(user) })
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
export function logout(_req: Request, res: Response) {
  // JWT stateless — o cliente remove o token localmente.
  res.json({ message: 'Sessão terminada.' })
}

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
export async function me(req: Request, res: Response) {
  const userId = req.user?.userId
  if (!userId) return res.status(401).json({ message: 'Não autenticado.' })

  const user = await findById(userId)
  if (!user) return res.status(404).json({ message: 'Utilizador não encontrado.' })

  return res.json({ user: toPublicUser(user) })
}

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
export async function forgotPassword(req: Request, res: Response) {
  const email = String(req.body?.email ?? '').toLowerCase().trim()
  if (!email) return res.status(400).json({ message: 'Email obrigatório.' })

  // Resposta sempre igual — não revela se o email existe
  const genericOk = { message: 'Se este email estiver registado, receberás um link de recuperação em breve.' }

  const user = await findByEmail(email)
  if (!user) return res.json(genericOk)

  // Gera token seguro de 64 hex chars e guarda na BD
  const token  = crypto.randomBytes(32).toString('hex')
  const expira = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

  await pool.query(
    'UPDATE utilizador SET token_reset = ?, token_reset_expira = ? WHERE id = ?',
    [token, expira, user.id],
  )

  enviarEmailRecuperacao(user.nome, user.email, token).catch(() => null)

  return res.json(genericOk)
}

// ── POST /api/auth/reset-password ────────────────────────────────────────────
export async function resetPassword(req: Request, res: Response) {
  const token    = String(req.body?.token    ?? '').trim()
  const password = String(req.body?.password ?? '')

  if (!token || password.length < 8) {
    return res.status(400).json({ message: 'Token e password (mín. 8 caracteres) são obrigatórios.' })
  }

  const [rows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE token_reset = ? AND token_reset_expira > NOW() AND ativo = 1 LIMIT 1',
    [token],
  )
  const user = rows[0]
  if (!user) {
    return res.status(400).json({ message: 'Link inválido ou expirado. Solicita um novo.' })
  }

  // Impede reutilizar a mesma password
  const equal = await bcrypt.compare(password, user.senha_hash)
  if (equal) {
    return res.status(422).json({ message: 'A nova senha não pode ser igual à senha actual.' })
  }

  const hash = await bcrypt.hash(password, 10)
  await pool.query(
    'UPDATE utilizador SET senha_hash = ?, token_reset = NULL, token_reset_expira = NULL WHERE id = ?',
    [hash, user.id],
  )

  return res.json({ message: 'Senha redefinida com sucesso.' })
}
