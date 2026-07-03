/**
 * ForumController
 * Gere as respostas de tópicos do fórum: criar, listar, apagar, like/dislike.
 */
import type { Request, Response } from 'express'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../config/database.js'
import { checkDiscussionAchievements } from '../services/achievement.service.js'
import { registarVoto } from '../services/forumVote.service.js'

// ── GET /api/topicos/:id/respostas ───────────────────────────────────────────
export async function listRespostas(req: Request, res: Response) {
  const userId = req.user!.userId
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.*, u.nome AS autor_nome, u.avatar_url AS autor_avatar, u.tipo AS autor_tipo,
            vr.valor AS meu_voto
     FROM resposta_forum r
     JOIN utilizador u ON u.id = r.autor_id
     LEFT JOIN voto_resposta vr ON vr.resposta_id = r.id AND vr.utilizador_id = ?
     WHERE r.topico_id = ? AND r.denunciado = 0
     ORDER BY r.resposta_pai_id IS NOT NULL, r.votos DESC, r.publicado_em ASC`,
    [userId, req.params.id],
  )
  res.json(rows)
}

// ── POST /api/respostas/:id/votar ─────────────────────────────────────────────
// body: { valor: 1 | -1 }. Idempotente (toggle) via forumVote.service.
export async function votarResposta(req: Request, res: Response) {
  const userId     = req.user!.userId
  const respostaId = Number(req.params.id)
  try {
    const resultado = await registarVoto(
      { votoTabela: 'voto_resposta', idColuna: 'resposta_id', alvoTabela: 'resposta_forum' },
      respostaId, userId, Number(req.body?.valor),
    )
    return res.json(resultado)
  } catch (err) {
    return res.status(400).json({ message: (err as Error).message })
  }
}

// ── POST /api/topicos/:id/respostas ──────────────────────────────────────────
export async function createResposta(req: Request, res: Response) {
  const userId   = req.user!.userId
  const topicoId = Number(req.params.id)
  const { conteudo, resposta_pai_id = null } = req.body ?? {}

  const ficheiro     = (req as any).file as Express.Multer.File | undefined
  const ficheiroUrl  = ficheiro ? `/uploads/forum/${ficheiro.filename}` : null
  const ficheiroNome = ficheiro ? ficheiro.originalname : null

  if (!conteudo?.trim() && !ficheiro) {
    return res.status(400).json({ message: 'Escreve uma mensagem ou anexa um ficheiro.' })
  }

  // Verifica se o tópico existe
  const [topicos] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM topico_forum WHERE id = ? LIMIT 1',
    [topicoId],
  )
  if (!(topicos as RowDataPacket[]).length) return res.status(404).json({ message: 'Tópico não encontrado.' })

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO resposta_forum (topico_id, autor_id, resposta_pai_id, conteudo, ficheiro_url, ficheiro_nome) VALUES (?, ?, ?, ?, ?, ?)',
    [topicoId, userId, resposta_pai_id || null, conteudo?.trim() || '', ficheiroUrl, ficheiroNome],
  )

  // Incrementa contador de respostas no tópico
  await pool.query('UPDATE topico_forum SET respostas = respostas + 1 WHERE id = ?', [topicoId])

  // Notifica o autor do tópico se for resposta raiz
  if (!resposta_pai_id) {
    const [topico] = await pool.query<RowDataPacket[]>(
      'SELECT criado_por FROM topico_forum WHERE id = ? LIMIT 1',
      [topicoId],
    )
    const autorTopico = (topico as RowDataPacket[])[0]?.['criado_por']
    if (autorTopico && autorTopico !== userId) {
      await pool.query(
        `INSERT INTO notificacao (usuario_id, tipo, entidade_id, titulo, mensagem, link_destino)
         VALUES (?, 'nova_resposta_forum', ?, 'Nova resposta no teu tópico', 'Alguém respondeu ao teu tópico no fórum.', ?)`,
        [autorTopico, topicoId, `/forum?topico=${topicoId}`],
      )
    }
  }

  checkDiscussionAchievements(userId).catch(() => null)

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.*, u.nome AS autor_nome, u.avatar_url AS autor_avatar
     FROM resposta_forum r JOIN utilizador u ON u.id = r.autor_id
     WHERE r.id = ? LIMIT 1`,
    [result.insertId],
  )
  return res.status(201).json(rows[0])
}

// ── DELETE /api/respostas/:id ─────────────────────────────────────────────────
export async function deleteResposta(req: Request, res: Response) {
  const userId = req.user!.userId
  const role   = req.user!.role

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM resposta_forum WHERE id = ? LIMIT 1',
    [req.params.id],
  )
  const resposta = rows[0]
  if (!resposta) return res.status(404).json({ message: 'Resposta não encontrada.' })

  // Só o autor ou admin pode apagar
  if (role !== 'admin' && resposta['autor_id'] !== userId) {
    return res.status(403).json({ message: 'Não tens permissão para apagar esta resposta.' })
  }

  await pool.query('DELETE FROM resposta_forum WHERE id = ?', [req.params.id])
  await pool.query(
    'UPDATE topico_forum SET respostas = GREATEST(0, respostas - 1) WHERE id = ?',
    [resposta['topico_id']],
  )

  return res.status(204).send()
}

// ── POST /api/respostas/:id/like ──────────────────────────────────────────────
export async function likeResposta(req: Request, res: Response) {
  const userId     = req.user!.userId
  const respostaId = Number(req.params.id)

  // Toggle: se já deu like remove, caso contrário adiciona
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM like_resposta_forum WHERE resposta_id = ? AND usuario_id = ? LIMIT 1`,
    [respostaId, userId],
  )

  let liked: boolean
  if ((rows as RowDataPacket[]).length) {
    await pool.query('DELETE FROM like_resposta_forum WHERE resposta_id = ? AND usuario_id = ?', [respostaId, userId])
    await pool.query('UPDATE resposta_forum SET likes = GREATEST(0, likes - 1) WHERE id = ?', [respostaId])
    liked = false
  } else {
    // INSERT IGNORE evita erro se a tabela não tiver a chave UNIQUE ainda
    await pool.query(
      'INSERT IGNORE INTO like_resposta_forum (resposta_id, usuario_id) VALUES (?, ?)',
      [respostaId, userId],
    )
    await pool.query('UPDATE resposta_forum SET likes = likes + 1 WHERE id = ?', [respostaId])
    liked = true
  }

  const [updated] = await pool.query<RowDataPacket[]>(
    'SELECT likes FROM resposta_forum WHERE id = ? LIMIT 1',
    [respostaId],
  )
  return res.json({ liked, likes: (updated as RowDataPacket[])[0]?.['likes'] ?? 0 })
}

// ── POST /api/topicos/:id/denunciar ───────────────────────────────────────────
export async function denunciarTopico(req: Request, res: Response) {
  const { motivo = null, descricao_detalhada = null } = req.body ?? {}

  // Verifica se o tópico existe
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM topico_forum WHERE id = ? LIMIT 1',
    [req.params.id],
  )
  if (!(rows as RowDataPacket[]).length) {
    return res.status(404).json({ message: 'Tópico não encontrado.' })
  }

  // INSERT IGNORE → só uma denúncia por utilizador por tópico
  await pool.query(
    `INSERT IGNORE INTO denuncia (topico_forum_id, denunciado_por, motivo, descricao_detalhada)
     VALUES (?, ?, ?, ?)`,
    [req.params.id, req.user!.userId, motivo, descricao_detalhada],
  )

  return res.json({ message: 'Denúncia registada. A equipa de moderação irá analisar.' })
}

// ── PATCH /api/respostas/:id/denunciar ────────────────────────────────────────
export async function denunciarResposta(req: Request, res: Response) {
  const { motivo = null, descricao_detalhada = null } = req.body ?? {}

  // INSERT IGNORE → só uma denúncia por utilizador por resposta
  await pool.query(
    `INSERT IGNORE INTO denuncia (resposta_forum_id, denunciado_por, motivo, descricao_detalhada)
     VALUES (?, ?, ?, ?)`,
    [req.params.id, req.user!.userId, motivo, descricao_detalhada],
  )

  return res.json({ message: 'Denúncia registada. A equipa de moderação irá analisar.' })
}
