/**
 * ProgressController
 * Gere o progresso de leitura do utilizador, conteúdos guardados e conquistas.
 */
import type { Request, Response } from 'express'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../config/database.js'
import { checkReadingAchievements } from '../services/achievement.service.js'

// ── GET /api/progresso ────────────────────────────────────────────────────────
export async function getProgresso(req: Request, res: Response) {
  const userId = req.user!.userId

  const [lidos] = await pool.query<RowDataPacket[]>(
    `SELECT p.*, c.titulo, c.tipo, c.categoria
     FROM progresso_utilizador p
     JOIN conteudo c ON c.id = p.conteudo_id
     WHERE p.subscrito_id = ?
     ORDER BY p.ultima_visualizacao DESC`,
    [userId],
  )

  const [stats] = await pool.query<RowDataPacket[]>(
    `SELECT
       COUNT(*) AS total_lidos,
       SUM(concluido) AS total_concluidos,
       (SELECT COUNT(*) FROM conteudo) AS total_conteudos
     FROM progresso_utilizador WHERE subscrito_id = ?`,
    [userId],
  )

  res.json({ conteudos: lidos, stats: stats[0] })
}

// ── POST /api/conteudos/:id/ler ───────────────────────────────────────────────
export async function marcarLido(req: Request, res: Response) {
  const userId     = req.user!.userId
  const conteudoId = Number(req.params.id)
  const {
    percentual_conclusao = 100,
    ultimo_ponto_parada  = null,
    concluido            = true,
  } = req.body ?? {}

  // INSERT ... ON DUPLICATE KEY UPDATE — regista ou actualiza a progressão
  await pool.query(
    `INSERT INTO progresso_utilizador
       (subscrito_id, conteudo_id, concluido, ultimo_ponto_parada, percentual_conclusao, visualizacoes)
     VALUES (?, ?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       concluido            = VALUES(concluido),
       ultimo_ponto_parada  = VALUES(ultimo_ponto_parada),
       percentual_conclusao = VALUES(percentual_conclusao),
       visualizacoes        = visualizacoes + 1,
       ultima_visualizacao  = NOW()`,
    [userId, conteudoId, concluido ? 1 : 0, ultimo_ponto_parada, percentual_conclusao],
  )

  // Incrementa contador de visualizações no conteúdo
  await pool.query(
    'UPDATE conteudo SET publicado_em = publicado_em WHERE id = ?',
    [conteudoId],
  )

  checkReadingAchievements(userId).catch(() => null)

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM progresso_utilizador WHERE subscrito_id = ? AND conteudo_id = ? LIMIT 1',
    [userId, conteudoId],
  )
  return res.json(rows[0])
}

// ── GET /api/favoritos ────────────────────────────────────────────────────────
export async function listFavoritos(req: Request, res: Response) {
  const userId = req.user!.userId

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT cs.*, c.titulo, c.tipo, c.categoria, c.tema, c.imagem_filename, c.publicado_em
     FROM conteudo_salvo cs
     JOIN conteudo c ON c.id = cs.conteudo_id
     WHERE cs.subscrito_id = ?
     ORDER BY cs.salvo_em DESC`,
    [userId],
  )
  res.json(rows)
}

// ── POST /api/conteudos/:id/favoritar ────────────────────────────────────────
export async function favoritarConteudo(req: Request, res: Response) {
  const userId     = req.user!.userId
  const conteudoId = Number(req.params.id)

  try {
    await pool.query(
      'INSERT INTO conteudo_salvo (subscrito_id, conteudo_id) VALUES (?, ?)',
      [userId, conteudoId],
    )
    return res.status(201).json({ message: 'Conteúdo guardado nos favoritos.' })
  } catch (err: unknown) {
    const mysqlErr = err as { code?: string }
    if (mysqlErr?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Conteúdo já está nos favoritos.' })
    }
    throw err
  }
}

// ── DELETE /api/conteudos/:id/favoritar ──────────────────────────────────────
export async function desfavoritarConteudo(req: Request, res: Response) {
  const userId     = req.user!.userId
  const conteudoId = Number(req.params.id)

  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM conteudo_salvo WHERE subscrito_id = ? AND conteudo_id = ?',
    [userId, conteudoId],
  )
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Conteúdo não estava nos favoritos.' })
  }
  return res.status(204).send()
}

// ── GET /api/conquistas ───────────────────────────────────────────────────────
export async function getConquistas(req: Request, res: Response) {
  const userId = req.user!.userId

  // Todas as conquistas disponíveis, marcando quais o utilizador já desbloqueou
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.*,
            cu.earned_at,
            CASE WHEN cu.id IS NOT NULL THEN 1 ELSE 0 END AS desbloqueada
     FROM conquista c
     LEFT JOIN conquista_utilizador cu
       ON cu.conquista_id = c.id AND cu.subscrito_id = ?
     ORDER BY c.id`,
    [userId],
  )
  res.json(rows)
}

// ── GET /api/ranking ──────────────────────────────────────────────────────────
export async function getRanking(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       u.id, u.nome, u.avatar_url, u.provincia,
       SUM(r.percentual_acerto) AS pontuacao_total,
       COUNT(DISTINCT r.quiz_id) AS quizzes_completados,
       MAX(r.data_realizacao) AS ultimo_quiz
     FROM resposta_quiz_usuario r
     JOIN utilizador u ON u.id = r.usuario_id
     WHERE u.ativo = 1
     GROUP BY u.id
     HAVING quizzes_completados > 0
     ORDER BY pontuacao_total DESC, ultimo_quiz ASC
     LIMIT 50`,
  )
  res.json(rows)
}
