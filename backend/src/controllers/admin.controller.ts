/**
 * AdminController
 * Rotas exclusivas de administradores: estatísticas, gestão de utilizadores,
 * moderação de conteúdos e exportação.
 */
import type { Request, Response } from 'express'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../config/database.js'
import { toPublicUser, type UserRecord } from '../types/index.js'

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
export async function getDashboardStats(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT
      (SELECT COUNT(*) FROM utilizador WHERE ativo = 1)                    AS total_utilizadores,
      (SELECT COUNT(*) FROM utilizador WHERE tipo = 'admin')               AS total_admins,
      (SELECT COUNT(*) FROM utilizador WHERE tipo = 'subscrito')           AS total_subscritores,
      (SELECT COUNT(*) FROM conteudo)                                      AS total_conteudos,
      (SELECT COUNT(*) FROM quiz WHERE ativo = 1)                          AS total_quizzes,
      (SELECT COUNT(*) FROM quiz_pergunta)                                 AS total_perguntas_quiz,
      (SELECT COUNT(*) FROM topico_forum)                                  AS total_topicos,
      (SELECT COUNT(*) FROM resposta_forum)                                AS total_respostas_forum,
      (SELECT COUNT(*) FROM resposta_quiz_usuario)                         AS total_tentativas_quiz,
      (SELECT COUNT(*) FROM utilizador WHERE DATE(criado_em) = CURDATE())  AS novos_hoje
  `)
  res.json(rows[0])
}

// ── GET /api/admin/utilizadores ───────────────────────────────────────────────
export async function listAllUsers(req: Request, res: Response) {
  const search = req.query['q']     ? `%${req.query['q']}%`   : null
  const tipo   = req.query['tipo']  as string | undefined
  const limit  = Math.min(Number(req.query['limit']  ?? 50),  200)
  const offset = Number(req.query['offset'] ?? 0)

  const where: string[] = ['1=1']
  const params: unknown[] = []

  if (search) {
    where.push('(u.nome LIKE ? OR u.email LIKE ?)')
    params.push(search, search)
  }
  if (tipo) {
    where.push('u.tipo = ?')
    params.push(tipo)
  }

  params.push(limit, offset)

  const [rows] = await pool.query<UserRecord[]>(
    `SELECT * FROM utilizador u WHERE ${where.join(' AND ')} ORDER BY criado_em DESC LIMIT ? OFFSET ?`,
    params,
  )

  const [count] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM utilizador u WHERE ${where.join(' AND ')}`,
    params.slice(0, -2),
  )

  res.json({ utilizadores: rows.map(toPublicUser), total: (count as RowDataPacket[])[0]?.['total'] ?? 0 })
}

// ── PATCH /api/admin/utilizadores/:id/tipo ────────────────────────────────────
export async function changeUserRole(req: Request, res: Response) {
  const { tipo } = req.body ?? {}
  if (!['visitante', 'subscrito', 'admin'].includes(tipo)) {
    return res.status(400).json({ message: 'tipo inválido. Use: visitante, subscrito ou admin.' })
  }

  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE utilizador SET tipo = ? WHERE id = ?',
    [tipo, req.params.id],
  )
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Utilizador não encontrado.' })

  res.json({ message: `Papel alterado para ${tipo}.` })
}

// ── PATCH /api/admin/utilizadores/:id/toggle ─────────────────────────────────
export async function toggleUserActive(req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT ativo FROM utilizador WHERE id = ? LIMIT 1',
    [req.params.id],
  )
  const user = rows[0]
  if (!user) return res.status(404).json({ message: 'Utilizador não encontrado.' })

  const novoEstado = user['ativo'] ? 0 : 1
  await pool.query('UPDATE utilizador SET ativo = ? WHERE id = ?', [novoEstado, req.params.id])

  res.json({ ativo: Boolean(novoEstado), message: novoEstado ? 'Conta activada.' : 'Conta suspensa.' })
}

// ── GET /api/admin/conteudos ──────────────────────────────────────────────────
export async function listAllConteudos(req: Request, res: Response) {
  const search = req.query['q']      ? `%${req.query['q']}%` : null
  const tipo   = req.query['tipo']   as string | undefined
  const limit  = Math.min(Number(req.query['limit']  ?? 50), 200)
  const offset = Number(req.query['offset'] ?? 0)

  const where: string[] = ['1=1']
  const params: unknown[] = []

  if (search) { where.push('(c.titulo LIKE ?)'); params.push(search) }
  if (tipo)   { where.push('c.tipo = ?');         params.push(tipo)   }

  params.push(limit, offset)

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.*, u.nome AS autor_nome
     FROM conteudo c LEFT JOIN utilizador u ON u.id = c.publicado_por
     WHERE ${where.join(' AND ')} ORDER BY c.publicado_em DESC LIMIT ? OFFSET ?`,
    params,
  )

  const [count] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM conteudo c WHERE ${where.join(' AND ')}`,
    params.slice(0, -2),
  )

  res.json({ conteudos: rows, total: (count as RowDataPacket[])[0]?.['total'] ?? 0 })
}

// ── GET /api/admin/denuncias ──────────────────────────────────────────────────
export async function listDenuncias(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT d.*, u.nome AS denunciado_por_nome,
            rf.conteudo   AS resposta_conteudo,
            tf.titulo     AS topico_titulo,
            tf.id         AS topico_id
     FROM denuncia d
     JOIN utilizador u ON u.id = d.denunciado_por
     LEFT JOIN resposta_forum rf ON rf.id = d.resposta_forum_id
     LEFT JOIN topico_forum   tf ON tf.id = d.topico_forum_id
     WHERE d.status = 'pendente'
     ORDER BY d.id DESC`,
  )
  res.json(rows)
}

// ── PATCH /api/admin/denuncias/:id ────────────────────────────────────────────
export async function resolveDenuncia(req: Request, res: Response) {
  const adminId = req.user!.userId
  const { status, observacoes = null } = req.body ?? {}

  if (!['ignorada', 'removida', 'banido'].includes(status)) {
    return res.status(400).json({ message: 'status deve ser: ignorada, removida ou banido.' })
  }

  await pool.query(
    `UPDATE denuncia SET status = ?, admin_acao = ?, observacoes_moderacao = ?, resolvido_em = NOW()
     WHERE id = ?`,
    [status, adminId, observacoes, req.params.id],
  )

  // Se removida, marca a resposta como denunciada
  if (status === 'removida') {
    const [d] = await pool.query<RowDataPacket[]>('SELECT resposta_forum_id FROM denuncia WHERE id = ? LIMIT 1', [req.params.id])
    const rfId = (d as RowDataPacket[])[0]?.['resposta_forum_id']
    if (rfId) await pool.query('UPDATE resposta_forum SET denunciado = 1 WHERE id = ?', [rfId])
  }

  res.json({ message: 'Denúncia resolvida.' })
}

// ── GET /api/admin/export/utilizadores-csv ────────────────────────────────────
export async function exportUsersCsv(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, nome, email, tipo, provincia, instituicao, curso, ativo, criado_em, ultimo_acesso
     FROM utilizador ORDER BY criado_em DESC`,
  )

  const header = 'id,nome,email,tipo,provincia,instituicao,curso,ativo,criado_em,ultimo_acesso\n'
  const csv = rows.map((r) =>
    [r['id'], `"${r['nome']}"`, `"${r['email']}"`, r['tipo'], r['provincia'] ?? '',
     `"${r['instituicao'] ?? ''}"`, `"${r['curso'] ?? ''}"`, r['ativo'],
     r['criado_em'], r['ultimo_acesso'] ?? ''].join(','),
  ).join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="utilizadores.csv"')
  res.send('\uFEFF' + header + csv) // BOM para compatibilidade com Excel
}

// ── GET /api/admin/export/actividade-csv ──────────────────────────────────────
export async function exportActivityCsv(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.nome, u.email,
            COUNT(DISTINCT rqu.id)  AS quizzes_feitos,
            COUNT(DISTINCT pu.id)   AS conteudos_lidos,
            COUNT(DISTINCT rf.id)   AS respostas_forum,
            MAX(u.ultimo_acesso)    AS ultimo_acesso
     FROM utilizador u
     LEFT JOIN resposta_quiz_usuario rqu ON rqu.usuario_id  = u.id
     LEFT JOIN progresso_utilizador  pu  ON pu.subscrito_id  = u.id
     LEFT JOIN resposta_forum        rf  ON rf.autor_id       = u.id
     WHERE u.ativo = 1
     GROUP BY u.id
     ORDER BY quizzes_feitos DESC, conteudos_lidos DESC`,
  )

  const header = 'nome,email,quizzes_feitos,conteudos_lidos,respostas_forum,ultimo_acesso\n'
  const csv = rows.map((r) =>
    [`"${r['nome']}"`, `"${r['email']}"`, r['quizzes_feitos'], r['conteudos_lidos'],
     r['respostas_forum'], r['ultimo_acesso'] ?? ''].join(','),
  ).join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="actividade.csv"')
  res.send('\uFEFF' + header + csv)
}

// ── GET /api/admin/solicitacoes ───────────────────────────────────────────────
// Lista todas as solicitações pendentes (Jindungo + Tópicos Privados)
export async function listSolicitacoes(_req: Request, res: Response) {
  const [jindungo] = await pool.query<RowDataPacket[]>(
    `SELECT
       s.id, 'jindungo' AS tipo,
       s.status, s.motivo, s.solicitado_em, s.respondido_em, s.observacoes_resposta,
       u.id   AS usuario_id,   u.nome  AS usuario_nome,  u.email AS usuario_email,
       c.id   AS conteudo_id,  c.titulo AS conteudo_titulo
     FROM solicitacao_acesso_jindungo s
     JOIN utilizador u ON u.id = s.subscrito_id
     JOIN conteudo   c ON c.id = s.conteudo_id
     ORDER BY s.solicitado_em DESC`,
  )

  const [topicos] = await pool.query<RowDataPacket[]>(
    `SELECT
       t.id, 'topico' AS tipo,
       t.status, t.motivo, t.solicitado_em, t.respondido_em, NULL AS observacoes_resposta,
       u.id   AS usuario_id,  u.nome  AS usuario_nome, u.email AS usuario_email,
       tf.id  AS conteudo_id, tf.titulo AS conteudo_titulo
     FROM topico_privado_acesso t
     JOIN utilizador   u  ON u.id  = t.subscrito_id
     JOIN topico_forum tf ON tf.id = t.topico_id
     ORDER BY t.solicitado_em DESC`,
  )

  res.json({
    jindungo: jindungo as RowDataPacket[],
    topicos:  topicos  as RowDataPacket[],
    total_pendentes:
      (jindungo as RowDataPacket[]).filter(r => r['status'] === 'pendente').length +
      (topicos  as RowDataPacket[]).filter(r => r['status'] === 'pendente').length,
  })
}

// ── PATCH /api/admin/solicitacoes/jindungo/:id ────────────────────────────────
export async function responderSolicitacaoJindungo(req: Request, res: Response) {
  const adminId = req.user!.userId
  const { status, observacoes = null } = req.body ?? {}

  if (!['aprovado', 'rejeitado'].includes(status)) {
    return res.status(400).json({ message: 'status deve ser: aprovado ou rejeitado.' })
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM solicitacao_acesso_jindungo WHERE id = ? LIMIT 1',
    [req.params['id']],
  )
  const sol = (rows as RowDataPacket[])[0]
  if (!sol) return res.status(404).json({ message: 'Solicitação não encontrada.' })

  await pool.query(
    `UPDATE solicitacao_acesso_jindungo
     SET status = ?, admin_responsavel = ?, observacoes_resposta = ?, respondido_em = NOW()
     WHERE id = ?`,
    [status, adminId, observacoes, req.params['id']],
  )

  // Notifica o utilizador
  if (status === 'aprovado') {
    const [conteudo] = await pool.query<RowDataPacket[]>(
      'SELECT titulo FROM conteudo WHERE id = ? LIMIT 1', [sol['conteudo_id']],
    )
    const titulo = (conteudo as RowDataPacket[])[0]?.['titulo'] ?? 'conteúdo'
    await pool.query(
      `INSERT INTO notificacao (usuario_id, tipo, entidade_id, titulo, mensagem, link_destino)
       VALUES (?, 'acesso_jindungo_aprovado', ?, 'Acesso aprovado', ?, '/explorar')`,
      [sol['subscrito_id'], sol['conteudo_id'], `O teu pedido de acesso a "${titulo}" foi aprovado.`],
    )
  }

  res.json({ message: `Solicitação Jindungo ${status}.` })
}

// ── PATCH /api/admin/solicitacoes/topico/:id ──────────────────────────────────
export async function responderSolicitacaoTopico(req: Request, res: Response) {
  const adminId = req.user!.userId
  const { status } = req.body ?? {}

  if (!['aprovado', 'rejeitado'].includes(status)) {
    return res.status(400).json({ message: 'status deve ser: aprovado ou rejeitado.' })
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM topico_privado_acesso WHERE id = ? LIMIT 1',
    [req.params['id']],
  )
  const sol = (rows as RowDataPacket[])[0]
  if (!sol) return res.status(404).json({ message: 'Solicitação não encontrada.' })

  await pool.query(
    `UPDATE topico_privado_acesso
     SET status = ?, admin_responsavel = ?, respondido_em = NOW()
     WHERE id = ?`,
    [status, adminId, req.params['id']],
  )

  // Notifica o utilizador
  if (status === 'aprovado') {
    const [topico] = await pool.query<RowDataPacket[]>(
      'SELECT titulo FROM topico_forum WHERE id = ? LIMIT 1', [sol['topico_id']],
    )
    const titulo = (topico as RowDataPacket[])[0]?.['titulo'] ?? 'tópico'
    await pool.query(
      `INSERT INTO notificacao (usuario_id, tipo, entidade_id, titulo, mensagem, link_destino)
       VALUES (?, 'acesso_topico_aprovado', ?, 'Acesso ao tópico aprovado', ?, ?)`,
      [sol['subscrito_id'], sol['topico_id'],
       `O teu pedido de acesso ao tópico "${titulo}" foi aprovado.`,
       `/forum/${sol['topico_id']}`],
    )
  }

  res.json({ message: `Solicitação de tópico ${status}.` })
}
