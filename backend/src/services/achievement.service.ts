import type { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { pool } from '../config/database.js'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Conquista {
  key_name:      string
  title:         string
  description:   string
  points_reward: number
}

interface ConquistaRow extends RowDataPacket {
  id: number
}

// Conquistas disponíveis
const CONQUISTAS: Record<string, Conquista> = {
  first_quiz:       { key_name: 'first_quiz',       title: 'Primeiro Quiz',          description: 'Completou o primeiro quiz',         points_reward: 50  },
  quiz_master:      { key_name: 'quiz_master',       title: 'Mestre dos Quizzes',     description: 'Completou 10 quizzes',             points_reward: 200 },
  perfect_score:    { key_name: 'perfect_score',     title: 'Pontuação Perfeita',     description: 'Obteve 100% num quiz',             points_reward: 100 },
  reader:           { key_name: 'reader',            title: 'Leitor Assíduo',         description: 'Leu 10 conteúdos',                 points_reward: 80  },
  bookworm:         { key_name: 'bookworm',          title: 'Devorador de Conteúdos', description: 'Leu 50 conteúdos',                 points_reward: 300 },
  first_discussion: { key_name: 'first_discussion',  title: 'Primeira Participação',  description: 'Participou pela primeira vez',     points_reward: 30  },
  active_member:    { key_name: 'active_member',     title: 'Membro Activo',          description: 'Fez 20 comentários em discussões', points_reward: 150 },
}

// ── Helpers internos ──────────────────────────────────────────────────────────
async function jaTemConquista(conn: PoolConnection, userId: number, keyName: string): Promise<boolean> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT 1 FROM conquista_utilizador cu
     JOIN conquista c ON c.id = cu.conquista_id
     WHERE cu.subscrito_id = ? AND c.key_name = ? LIMIT 1`,
    [userId, keyName],
  )
  return rows.length > 0
}

async function desbloquear(conn: PoolConnection, userId: number, keyName: string): Promise<void> {
  if (await jaTemConquista(conn, userId, keyName)) return

  const c = CONQUISTAS[keyName]!

  await conn.query(
    `INSERT IGNORE INTO conquista (key_name, title, description, points_reward)
     VALUES (?, ?, ?, ?)`,
    [c.key_name, c.title, c.description, c.points_reward],
  )

  const [rows] = await conn.query<ConquistaRow[]>(
    'SELECT id FROM conquista WHERE key_name = ? LIMIT 1',
    [keyName],
  )
  const conquistaId = rows[0]?.id
  if (!conquistaId) return

  await conn.query(
    'INSERT IGNORE INTO conquista_utilizador (subscrito_id, conquista_id) VALUES (?, ?)',
    [userId, conquistaId],
  )

  await conn.query(
    `INSERT INTO notificacao (usuario_id, tipo, entidade_id, titulo, mensagem)
     VALUES (?, 'novo_quiz', ?, ?, ?)`,
    [userId, conquistaId, `🏆 Conquista desbloqueada: ${c.title}`, c.description],
  )
}

// ── Gatilhos públicos ─────────────────────────────────────────────────────────

export async function checkQuizAchievements(userId: number, percentagem: number): Promise<void> {
  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM resposta_quiz_usuario WHERE usuario_id = ?',
      [userId],
    )
    const total = Number((rows[0] as RowDataPacket)['total'] ?? 0)
    if (total >= 1)  await desbloquear(conn, userId, 'first_quiz')
    if (total >= 10) await desbloquear(conn, userId, 'quiz_master')
    if (percentagem === 100) await desbloquear(conn, userId, 'perfect_score')
  } catch (err) {
    console.warn('achievement check failed (quiz):', err)
  } finally {
    conn.release()
  }
}

export async function checkReadingAchievements(userId: number): Promise<void> {
  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM progresso_utilizador WHERE subscrito_id = ?',
      [userId],
    )
    const total = Number((rows[0] as RowDataPacket)['total'] ?? 0)
    if (total >= 10) await desbloquear(conn, userId, 'reader')
    if (total >= 50) await desbloquear(conn, userId, 'bookworm')
  } catch (err) {
    console.warn('achievement check failed (reading):', err)
  } finally {
    conn.release()
  }
}

export async function checkDiscussionAchievements(userId: number): Promise<void> {
  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM resposta_forum WHERE autor_id = ?',
      [userId],
    )
    const total = Number((rows[0] as RowDataPacket)['total'] ?? 0)
    if (total >= 1)  await desbloquear(conn, userId, 'first_discussion')
    if (total >= 20) await desbloquear(conn, userId, 'active_member')
  } catch (err) {
    console.warn('achievement check failed (discussion):', err)
  } finally {
    conn.release()
  }
}
