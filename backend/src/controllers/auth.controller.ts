import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../config/database.js'
import { signToken } from '../config/jwt.js'
import { toPublicUser, type UserRecord } from '../types/index.js'
import { enviarEmailBoasVindas, enviarEmailRecuperacao } from '../services/email.service.js'
import {
  criarTokenReset,
  encontrarTokenValido,
  marcarTokenUsado,
  limparTokensReset,
} from '../services/password-reset.service.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function findByEmail(email: string): Promise<UserRecord | null> {
  const [rows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE email = ? LIMIT 1',
    [email],
  )
  return (rows as unknown as UserRecord[])[0] ?? null
}

async function findById(id: number): Promise<UserRecord | null> {
  const [rows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE id = ? LIMIT 1',
    [id],
  )
  return (rows as unknown as UserRecord[])[0] ?? null
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

  const hash     = await bcrypt.hash(String(password), 10)
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

  // Email de boas-vindas não-bloqueante
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

  // Resposta genérica — não revela se o email está registado (segurança contra enumeração)
  const genericOk = {
    message: 'Se este email estiver registado, receberás um link de recuperação em breve.',
  }

  // ✅ Verifica se o email existe na base de dados ANTES de criar o token
  const user = await findByEmail(email)
  if (!user) {
    // Pequeno delay para evitar timing attacks (user vs no-user)
    await new Promise((r) => setTimeout(r, 200))
    return res.json(genericOk)
  }

  // Utilizador inactivo não recebe email (mas resposta continua genérica)
  if (!user.ativo) return res.json(genericOk)

  // Cria token dedicado na tabela password_resets (invalida o anterior)
  const token = await criarTokenReset(user.id)

  // Envia email de forma não-bloqueante
  enviarEmailRecuperacao(user.nome, user.email, token).catch(() => null)

  return res.json(genericOk)
}

// ── POST /api/auth/reset-password ────────────────────────────────────────────
export async function resetPassword(req: Request, res: Response) {
  const token    = String(req.body?.token    ?? '').trim()
  const password = String(req.body?.password ?? '')

  if (!token || password.length < 8) {
    return res
      .status(400)
      .json({ message: 'Token e password (mín. 8 caracteres) são obrigatórios.' })
  }

  // Valida token na tabela dedicada
  const resetRecord = await encontrarTokenValido(token)
  if (!resetRecord) {
    return res
      .status(400)
      .json({ message: 'Link inválido ou expirado. Solicita um novo.' })
  }

  // Carrega o utilizador para verificar a password actual
  const user = await findById(resetRecord.user_id)
  if (!user || !user.ativo) {
    return res.status(400).json({ message: 'Utilizador não encontrado ou inactivo.' })
  }

  // Impede reutilizar a mesma password
  const equal = await bcrypt.compare(password, user.senha_hash)
  if (equal) {
    return res
      .status(422)
      .json({ message: 'A nova senha não pode ser igual à senha actual.' })
  }

  const hash = await bcrypt.hash(password, 10)

  // Actualiza a senha e marca o token como usado (transacção implícita via 2 queries atómicas)
  await pool.query(
    'UPDATE utilizador SET senha_hash = ? WHERE id = ?',
    [hash, user.id],
  )
  await marcarTokenUsado(resetRecord.id)

  // Limpa todos os outros tokens deste utilizador (segurança extra)
  await limparTokensReset(user.id)

  return res.json({ message: 'Senha redefinida com sucesso.' })
}
