/**
 * ComentarioController
 * Comentários associados a conteúdos (não ao fórum).
 * Suporta threading (comentário pai → respostas filhas) e likes.
 */
import type { Request, Response } from 'express'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../config/database.js'

// ── GET /api/conteudos/:id/comentarios ───────────────────────────────────────
export async function listComentarios(req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.*, u.nome AS autor_nome, u.avatar_url AS autor_avatar, u.tipo AS autor_tipo
     FROM comentario_conteudo c
     JOIN utilizador u ON u.id = c.autor_id
     WHERE c.conteudo_id = ? AND c.denunciado = 0
     ORDER BY c.comentario_pai_id IS NOT NULL, c.publicado_em ASC`,
    [req.params.id],
  )
  res.json(rows)
}

// ── POST /api/conteudos/:id/comentarios ──────────────────────────────────────
export async function createComentario(req: Request, res: Response) {
  const userId     = req.user!.userId
  const conteudoId = Number(req.params.id)
  const { comentario, comentario_pai_id = null } = req.body ?? {}

  if (!comentario?.trim()) return res.status(400).json({ message: 'comentario é obrigatório.' })

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO comentario_conteudo (conteudo_id, autor_id, comentario_pai_id, comentario)
     VALUES (?, ?, ?, ?)`,
    [conteudoId, userId, comentario_pai_id || null, comentario.trim()],
  )

  // Notifica o autor do comentário pai, se for resposta
  if (comentario_pai_id) {
    const [pai] = await pool.query<RowDataPacket[]>(
      'SELECT autor_id FROM comentario_conteudo WHERE id = ? LIMIT 1',
      [comentario_pai_id],
    )
    const autorPai = (pai as RowDataPacket[])[0]?.['autor_id']
    if (autorPai && autorPai !== userId) {
      await pool.query(
        `INSERT INTO notificacao (usuario_id, tipo, entidade_id, titulo, mensagem, link_destino)
         VALUES (?, 'resposta_comentario', ?, 'Nova resposta ao teu comentário', 'Alguém respondeu ao teu comentário.', ?)`,
        [autorPai, conteudoId, `/conteudo/${conteudoId}`],
      )
    }
  }

  // Notifica o criador do conteúdo quando alguém (não ele próprio) comenta
  if (!comentario_pai_id) {
    const [conteudo] = await pool.query<RowDataPacket[]>(
      'SELECT publicado_por, titulo FROM conteudo WHERE id = ? LIMIT 1',
      [conteudoId],
    )
    const criador = (conteudo as RowDataPacket[])[0]?.['publicado_por']
    const titulo  = (conteudo as RowDataPacket[])[0]?.['titulo'] ?? 'conteúdo'
    if (criador && criador !== userId) {
      await pool.query(
        `INSERT INTO notificacao (usuario_id, tipo, entidade_id, titulo, mensagem, link_destino)
         VALUES (?, 'novo_comentario_conteudo', ?, 'Novo comentário no teu conteúdo', ?, '/explorar')`,
        [criador, conteudoId, `Alguém comentou em "${titulo}".`],
      )
    }
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.*, u.nome AS autor_nome, u.avatar_url AS autor_avatar
     FROM comentario_conteudo c JOIN utilizador u ON u.id = c.autor_id
     WHERE c.id = ? LIMIT 1`,
    [result.insertId],
  )
  return res.status(201).json(rows[0])
}

// ── DELETE /api/comentarios/:id ───────────────────────────────────────────────
export async function deleteComentario(req: Request, res: Response) {
  const userId = req.user!.userId
  const role   = req.user!.role

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM comentario_conteudo WHERE id = ? LIMIT 1',
    [req.params.id],
  )
  const comentario = rows[0]
  if (!comentario) return res.status(404).json({ message: 'Comentário não encontrado.' })

  if (role !== 'admin' && comentario['autor_id'] !== userId) {
    return res.status(403).json({ message: 'Não podes apagar este comentário.' })
  }

  await pool.query('DELETE FROM comentario_conteudo WHERE id = ?', [req.params.id])
  return res.status(204).send()
}

// ── POST /api/comentarios/:id/like ───────────────────────────────────────────
export async function likeComentario(req: Request, res: Response) {
  const userId       = req.user!.userId
  const comentarioId = Number(req.params.id)

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM like_comentario_conteudo WHERE comentario_id = ? AND usuario_id = ? LIMIT 1',
    [comentarioId, userId],
  )

  let liked: boolean
  if ((rows as RowDataPacket[]).length) {
    await pool.query('DELETE FROM like_comentario_conteudo WHERE comentario_id = ? AND usuario_id = ?', [comentarioId, userId])
    await pool.query('UPDATE comentario_conteudo SET likes = GREATEST(0, likes - 1) WHERE id = ?', [comentarioId])
    liked = false
  } else {
    await pool.query(
      'INSERT IGNORE INTO like_comentario_conteudo (comentario_id, usuario_id) VALUES (?, ?)',
      [comentarioId, userId],
    )
    await pool.query('UPDATE comentario_conteudo SET likes = likes + 1 WHERE id = ?', [comentarioId])
    liked = true

    // Notifica autor do comentário
    const [owner] = await pool.query<RowDataPacket[]>(
      'SELECT autor_id FROM comentario_conteudo WHERE id = ? LIMIT 1',
      [comentarioId],
    )
    const autorId = (owner as RowDataPacket[])[0]?.['autor_id']
    if (autorId && autorId !== userId) {
      await pool.query(
        `INSERT INTO notificacao (usuario_id, tipo, entidade_id, titulo, mensagem)
         VALUES (?, 'like_comentario', ?, 'Gostaram do teu comentário', 'O teu comentário recebeu um like.')`,
        [autorId, comentarioId],
      )
    }
  }

  const [updated] = await pool.query<RowDataPacket[]>(
    'SELECT likes FROM comentario_conteudo WHERE id = ? LIMIT 1',
    [comentarioId],
  )
  return res.json({ liked, likes: (updated as RowDataPacket[])[0]?.['likes'] ?? 0 })
}
