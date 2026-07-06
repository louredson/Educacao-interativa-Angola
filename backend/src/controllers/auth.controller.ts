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
import { eventBus } from '../services/events.service.js'

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

  // Evento de domínio: permite que outros módulos reajam ao novo registo
  eventBus.emit('utilizador:registado', { userId: user.id, nome: user.nome, email: user.email })

  return res.status(201).json({ token, user: toPublicUser(user) })
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {}

  if (!email || !password) {
    return res.status(400).json({ message: 'email e password são obrigatórios.' })
  }

  const user = await findByEmail(String(email).toLowerCase())
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

  // Verifica se o email existe na base de dados
  const user = await findByEmail(email)

  if (!user) {
    return res.status(404).json({
      message: 'Este email não está registado. Verifica o endereço introduzido.',
    })
  }

  // Utilizador inactivo
  if (!user.ativo) {
    return res.status(403).json({
      message: 'Esta conta está inactiva. Contacta o suporte.',
    })
  }

  // Cria token dedicado na tabela password_resets (invalida o anterior)
  const token = await criarTokenReset(user.id)

  // Envia email — aguarda para poder reportar erro ao cliente
  try {
    await enviarEmailRecuperacao(user.nome, user.email, token)
  } catch (err) {
    console.error('❌ Erro ao enviar email de recuperação:', err)
    // Mesmo com falha no SMTP, o token ficou gravado e o link está em logs/emails.log
    return res.status(500).json({
      message: 'Não foi possível enviar o email. Tenta novamente mais tarde.',
    })
  }

  return res.json({
    message: 'Email de recuperação enviado com sucesso. Verifica a tua caixa de entrada.',
  })
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

  // Carrega o utilizador
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

  await pool.query(
    'UPDATE utilizador SET senha_hash = ? WHERE id = ?',
    [hash, user.id],
  )
  await marcarTokenUsado(resetRecord.id)
  await limparTokensReset(user.id)

  return res.json({ message: 'Senha redefinida com sucesso.' })
}
