import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../config/database.js'
import { toPublicUser, type UserRecord } from '../types/index.js'

// ── Helper ────────────────────────────────────────────────────────────────────
async function getUserById(id: string | number) {
  const [rows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE id = ? LIMIT 1',
    [id],
  )
  return rows[0] ?? null
}

// ── GET /api/users ────────────────────────────────────────────────────────────
export async function listUsers(_req: Request, res: Response) {
  const [rows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador ORDER BY criado_em DESC, id DESC',
  )
  res.json(rows.map(toPublicUser))
}

// ── GET /api/users/:id ────────────────────────────────────────────────────────
export async function getUser(req: Request, res: Response) {
  const user = await getUserById(req.params['id'] as string)
  if (!user) return res.status(404).json({ message: 'Utilizador não encontrado.' })
  return res.json(toPublicUser(user))
}

// ── POST /api/users ───────────────────────────────────────────────────────────
export async function createUser(req: Request, res: Response) {
  const {
    name,
    email,
    password,
    phone       = null,
    province    = 'Luanda',
    institution = null,
    course      = null,
    role        = 'subscrito',
    avatarUrl   = null,
    isActive    = true,
  } = req.body ?? {}

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email e password são obrigatórios.' })
  }

  const [existingRows] = await pool.query<UserRecord[]>(
    'SELECT * FROM utilizador WHERE email = ? LIMIT 1',
    [email],
  )
  if (existingRows[0]) return res.status(409).json({ message: 'Email já registado.' })

  const senhaHash = await bcrypt.hash(String(password), 10)

  const [result] = await pool.query(
    `INSERT INTO utilizador
       (nome, email, senha_hash, telemovel, provincia, instituicao, curso, tipo, avatar_url, ativo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, email, senhaHash, phone, province, institution, course, role, avatarUrl, isActive ? 1 : 0],
  )

  const insertId = (result as { insertId: number }).insertId
  const user     = await getUserById(insertId)
  if (!user) return res.status(500).json({ message: 'Falha ao criar utilizador.' })

  return res.status(201).json(toPublicUser(user))
}

// ── PUT /api/users/:id ────────────────────────────────────────────────────────
export async function updateUser(req: Request, res: Response) {
  const id      = req.params['id'] as string
  const fields  = req.body ?? {}

  const allowed = [
    'name', 'email', 'password', 'phone', 'province',
    'institution', 'course', 'role', 'avatarUrl', 'isActive',
  ] as const

  const updates: string[] = []
  const values:  unknown[] = []

  for (const key of allowed) {
    if (!Object.prototype.hasOwnProperty.call(fields, key)) continue

    switch (key) {
      case 'password':
        updates.push('senha_hash = ?')
        values.push(await bcrypt.hash(String(fields[key]), 10))
        break
      case 'name':        updates.push('nome = ?');       values.push(fields[key]); break
      case 'phone':       updates.push('telemovel = ?');  values.push(fields[key]); break
      case 'role':        updates.push('tipo = ?');       values.push(fields[key]); break
      case 'avatarUrl':   updates.push('avatar_url = ?'); values.push(fields[key]); break
      case 'isActive':    updates.push('ativo = ?');      values.push(fields[key] ? 1 : 0); break
      case 'institution': updates.push('instituicao = ?');values.push(fields[key]); break
      case 'course':      updates.push('curso = ?');      values.push(fields[key]); break
      default:
        updates.push(`${key} = ?`)
        values.push(fields[key])
    }
  }

  if (!updates.length) return res.status(400).json({ message: 'Nenhum campo para actualizar.' })

  values.push(id)
  const [result] = await pool.query(
    `UPDATE utilizador SET ${updates.join(', ')} WHERE id = ?`,
    values,
  )

  if ((result as { affectedRows: number }).affectedRows === 0) {
    return res.status(404).json({ message: 'Utilizador não encontrado.' })
  }

  const updated = await getUserById(id)
  return res.json(updated ? toPublicUser(updated) : null)
}

// ── DELETE /api/users/:id ─────────────────────────────────────────────────────
export async function deleteUser(req: Request, res: Response) {
  const [result] = await pool.query(
    'DELETE FROM utilizador WHERE id = ?',
    [req.params['id']],
  )
  if ((result as { affectedRows: number }).affectedRows === 0) {
    return res.status(404).json({ message: 'Utilizador não encontrado.' })
  }
  return res.status(204).send()
}
