import type { Request, Response } from 'express'
import { pool } from '../config/database.js'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { registarVoto } from '../services/forumVote.service.js'

type TopicoRow = RowDataPacket & {
  id: number
  titulo: string
  descricao: string
  criado_por: number
  tipo_privacidade: 'publico' | 'privado'
  categoria: string | null
  requires_access: number | 0 | 1
  likes: number
  respostas: number
  criado_em: string
  ultima_atividade: string
}

function toBoolean(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true'
}

// ── GET /api/topicos ──────────────────────────────────────────────────────────
// Suporta ?categoria= &sort=recentes|populares|sem-resposta|resolvidos &q=
// Fixados aparecem sempre primeiro. Inclui autor e (se autenticado) o voto do utilizador.
export async function listTopicos(req: Request, res: Response) {
  const userId    = req.user?.userId ?? null
  const categoria = typeof req.query.categoria === 'string' ? req.query.categoria : ''
  const sort      = typeof req.query.sort === 'string' ? req.query.sort : 'recentes'
  const q         = typeof req.query.q === 'string' ? req.query.q.trim() : ''

  const params: unknown[] = []
  let meuVotoSel = ''
  let meuVotoJoin = ''
  let acessoSel = ''
  let acessoJoin = ''
  const userRole = req.user?.role ?? ''
  const isAdmin  = userRole === 'admin' || userRole === 'superadmin'

  if (userId) {
    meuVotoSel  = ', vt.valor AS meu_voto'
    meuVotoJoin = 'LEFT JOIN voto_topico vt ON vt.topico_id = t.id AND vt.utilizador_id = ?'
    acessoSel   = ', tpa.status AS acesso_pedido'
    acessoJoin  = 'LEFT JOIN topico_privado_acesso tpa ON tpa.topico_id = t.id AND tpa.subscrito_id = ?'
    params.push(userId, userId)
  }

  // Para criadores e admins: conta pedidos pendentes nos tópicos privados
  const pedidosSel  = userId ? ', (SELECT COUNT(*) FROM topico_privado_acesso p WHERE p.topico_id = t.id AND p.status = \'pendente\') AS pedidos_pendentes' : ''

  const where: string[] = []
  if (categoria && !['all', 'todas', 'todos'].includes(categoria.toLowerCase())) {
    where.push('t.categoria = ?'); params.push(categoria)
  }
  if (q) {
    where.push('(t.titulo LIKE ? OR t.descricao LIKE ?)'); params.push(`%${q}%`, `%${q}%`)
  }
  if (sort === 'sem-resposta') where.push('t.respostas = 0')
  if (sort === 'resolvidos')   where.push('t.resolvido = 1')
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''

  // Cada ordenação termina sempre em `t.id DESC` (chave única) para ser
  // 100% determinística — em caso de empate, nunca fica "ao acaso".
  // Regra de empate: a mais recente fica acima da mais antiga (criado_em DESC).
  const orderMap: Record<string, string> = {
    populares:      't.votos DESC, t.criado_em DESC, t.id DESC',
    recentes:       't.criado_em DESC, t.id DESC',
    'sem-resposta': 't.criado_em DESC, t.id DESC',
    resolvidos:     't.ultima_atividade DESC, t.id DESC',
  }
  const orderBy = orderMap[sort] ?? 't.ultima_atividade DESC, t.id DESC'

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT t.id, t.titulo, t.descricao, t.criado_por, t.tipo_privacidade, t.categoria, t.tags,
            t.requires_access, t.fixado, t.resolvido, t.fechado, t.resposta_aceite_id,
            t.likes, t.votos, t.respostas, t.visualizacoes, t.criado_em, t.ultima_atividade,
            u.nome AS autor_nome, u.avatar_url AS autor_avatar, u.tipo AS autor_tipo${meuVotoSel}${acessoSel}${pedidosSel}
     FROM topico_forum t
     JOIN utilizador u ON u.id = t.criado_por
     ${meuVotoJoin}
     ${acessoJoin}
     ${whereClause}
     ORDER BY t.fixado DESC, ${orderBy}`,
    params,
  )
  res.json(rows)
}

// ── GET /api/topicos/:id ──────────────────────────────────────────────────────
// Incrementa visualizações e devolve o tópico já com as respostas (e voto do utilizador).
export async function getTopicoById(req: Request, res: Response) {
  const userId   = req.user?.userId ?? null
  const topicoId = Number(req.params.id)

  await pool.query('UPDATE topico_forum SET visualizacoes = visualizacoes + 1 WHERE id = ?', [topicoId])

  const topParams: unknown[] = []
  let tVotoSel = '', tVotoJoin = ''
  if (userId) {
    tVotoSel  = ', vt.valor AS meu_voto'
    tVotoJoin = 'LEFT JOIN voto_topico vt ON vt.topico_id = t.id AND vt.utilizador_id = ?'
    topParams.push(userId)
  }
  topParams.push(topicoId)

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT t.*, u.nome AS autor_nome, u.avatar_url AS autor_avatar, u.tipo AS autor_tipo${tVotoSel}
     FROM topico_forum t
     JOIN utilizador u ON u.id = t.criado_por
     ${tVotoJoin}
     WHERE t.id = ? LIMIT 1`,
    topParams,
  )
  const topico = rows[0]
  if (!topico) return res.status(404).json({ message: 'Tópico não encontrado' })

  const respParams: unknown[] = []
  let rVotoSel = '', rVotoJoin = ''
  if (userId) {
    rVotoSel  = ', vr.valor AS meu_voto'
    rVotoJoin = 'LEFT JOIN voto_resposta vr ON vr.resposta_id = r.id AND vr.utilizador_id = ?'
    respParams.push(userId)
  }
  respParams.push(topicoId)

  const [respRows] = await pool.query<RowDataPacket[]>(
    `SELECT r.id, r.topico_id, r.autor_id, r.resposta_pai_id, r.conteudo, r.likes, r.votos, r.publicado_em,
            u.nome AS autor_nome, u.avatar_url AS autor_avatar, u.tipo AS autor_tipo${rVotoSel}
     FROM resposta_forum r
     JOIN utilizador u ON u.id = r.autor_id
     ${rVotoJoin}
     WHERE r.topico_id = ? AND r.denunciado = 0
     ORDER BY r.votos DESC, r.publicado_em DESC, r.id DESC`,
    respParams,
  )

  const aceiteId = topico['resposta_aceite_id']
  const respostas = (respRows as RowDataPacket[])
    .map((r) => ({ ...r, aceite: r['id'] === aceiteId }))
    .sort((a, b) => Number(b.aceite) - Number(a.aceite)) // resposta aceite primeiro

  return res.json({ ...topico, respostas })
}

export async function createTopico(req: Request, res: Response) {
  const {
    titulo,
    descricao,
    tipo_privacidade = 'publico',
    categoria = null,
    tags = null,
    requires_access = false,
  } = req.body ?? {}

  // Usa o utilizador autenticado pelo JWT; aceita criado_por do body como fallback legacy
  const criado_por = req.user?.userId ?? req.body?.criado_por

  if (!titulo || !descricao || !criado_por) {
    return res.status(400).json({ message: 'titulo, descricao são obrigatórios e deve estar autenticado' })
  }

  // Normaliza tags: aceita string "a, b" ou array; guarda como string separada por vírgulas
  const tagsStr = Array.isArray(tags)
    ? tags.join(', ')
    : (typeof tags === 'string' && tags.trim() ? tags.trim() : null)

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO topico_forum
      (titulo, descricao, criado_por, tipo_privacidade, categoria, tags, requires_access)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      titulo,
      descricao,
      criado_por,
      tipo_privacidade,
      categoria,
      tagsStr,
      toBoolean(requires_access) ? 1 : 0,
    ],
  )

  const [rows] = await pool.query<TopicoRow[]>(
    'SELECT * FROM topico_forum WHERE id = ? LIMIT 1',
    [result.insertId],
  )

  return res.status(201).json(rows[0])
}

export async function updateTopico(req: Request, res: Response) {
  const userId   = req.user!.userId
  const role     = req.user!.role
  const id       = req.params.id
  const fields   = req.body ?? {}

  // Propriedade: só o autor do tópico ou um admin/superadmin pode editar
  const [donoRows] = await pool.query<RowDataPacket[]>(
    'SELECT criado_por FROM topico_forum WHERE id = ? LIMIT 1',
    [id],
  )
  const dono = donoRows[0]
  if (!dono) return res.status(404).json({ message: 'Tópico não encontrado' })

  const isAdmin = role === 'admin' || role === 'superadmin'
  if (!isAdmin && dono['criado_por'] !== userId) {
    return res.status(403).json({ message: 'Só o autor do tópico ou um administrador pode editá-lo.' })
  }

  // O autor só altera o conteúdo; o admin pode mexer em tudo
  const allowedFields = (isAdmin
    ? ['titulo', 'descricao', 'tipo_privacidade', 'categoria', 'tags', 'requires_access', 'likes', 'respostas']
    : ['titulo', 'descricao', 'tipo_privacidade', 'categoria', 'tags']) as readonly string[]

  const updates: string[] = []
  const values: unknown[] = []

  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      updates.push(`${key} = ?`)
      values.push(key === 'requires_access' ? (toBoolean(fields[key]) ? 1 : 0) : fields[key])
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'Nenhum campo para atualizar' })
  }

  values.push(id)

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE topico_forum SET ${updates.join(', ')} WHERE id = ?`,
    values,
  )

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Tópico não encontrado' })
  }

  const [rows] = await pool.query<TopicoRow[]>(
    'SELECT * FROM topico_forum WHERE id = ? LIMIT 1',
    [id],
  )

  return res.json(rows[0])
}

export async function deleteTopico(req: Request, res: Response) {
  const userId   = req.user!.userId
  const role     = req.user!.role
  const topicoId = Number(req.params.id)

  // Verifica propriedade: só o autor do tópico ou um admin/superadmin pode apagar
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT criado_por FROM topico_forum WHERE id = ? LIMIT 1',
    [topicoId],
  )
  const topico = rows[0]
  if (!topico) return res.status(404).json({ message: 'Tópico não encontrado' })

  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'professor'
  if (!isAdmin && topico['criado_por'] !== userId) {
    return res.status(403).json({ message: 'Só o autor do tópico ou um administrador pode apagá-lo.' })
  }

  await pool.query('DELETE FROM topico_forum WHERE id = ?', [topicoId])
  return res.status(204).send()
}


// ── POST /api/topicos/:id/solicitar-acesso ────────────────────────────────────
export async function solicitarAcessoTopico(req: Request, res: Response) {
  const userId   = req.user?.userId ?? req.body?.criado_por
  const topicoId = Number(req.params.id)
  const { motivo = null } = req.body ?? {}

  if (!userId) return res.status(401).json({ message: 'Não autenticado.' })

  try {
    await pool.query(
      `INSERT INTO topico_privado_acesso (topico_id, subscrito_id, motivo)
       VALUES (?, ?, ?)`,
      [topicoId, userId, motivo],
    )

    // Notifica o criador do tópico
    const [topicoRows] = await pool.query<RowDataPacket[]>(
      'SELECT criado_por, titulo FROM topico_forum WHERE id = ? LIMIT 1',
      [topicoId],
    )
    const topico = topicoRows[0]
    const [solicitante] = await pool.query<RowDataPacket[]>(
      'SELECT nome FROM utilizador WHERE id = ? LIMIT 1',
      [userId],
    )
    if (topico && topico['criado_por'] !== userId) {
      await pool.query(
        `INSERT INTO notificacao (usuario_id, tipo, entidade_id, titulo, mensagem, link_destino)
         VALUES (?, 'pedido_acesso_topico', ?, ?, ?, ?)`,
        [
          topico['criado_por'],
          topicoId,
          'Pedido de acesso ao teu tópico',
          `${solicitante[0]?.['nome'] ?? 'Alguém'} pediu acesso ao tópico "${topico['titulo']}"`,
          `/forum?topico=${topicoId}`,
        ],
      )
    }

    return res.status(201).json({ message: 'Solicitação de acesso enviada com sucesso.' })
  } catch (err: any) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Já enviaste uma solicitação para este tópico.' })
    }
    console.error('solicitarAcessoTopico:', err)
    return res.status(500).json({ message: 'Erro interno do servidor.' })
  }
}

// ── DELETE /api/topicos/:id/solicitar-acesso ──────────────────────────────────
// Cancela o próprio pedido de acesso enquanto está pendente
export async function cancelarAcessoTopico(req: Request, res: Response) {
  const userId   = req.user!.userId
  const topicoId = Number(req.params.id)

  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM topico_privado_acesso
     WHERE topico_id = ? AND subscrito_id = ? AND status = 'pendente'`,
    [topicoId, userId],
  )
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Pedido pendente não encontrado.' })
  }
  res.json({ message: 'Pedido de acesso cancelado.' })
}

// ── GET /api/topicos/:id/pedidos-acesso ───────────────────────────────────────
// Lista pedidos pendentes — apenas o criador do tópico pode ver
export async function listarPedidosAcesso(req: Request, res: Response) {
  const userId   = req.user!.userId
  const topicoId = Number(req.params.id)

  const role = req.user!.role
  const isAdmin = role === 'admin' || role === 'superadmin'

  const [dono] = await pool.query<RowDataPacket[]>(
    'SELECT criado_por FROM topico_forum WHERE id = ? LIMIT 1', [topicoId],
  )
  if (!dono[0]) return res.status(404).json({ message: 'Tópico não encontrado.' })
  if (dono[0]['criado_por'] !== userId && !isAdmin) return res.status(403).json({ message: 'Sem permissão.' })

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT tpa.id, tpa.subscrito_id, tpa.status, tpa.motivo, tpa.solicitado_em AS criado_em,
            u.nome, u.email, u.avatar_url
     FROM topico_privado_acesso tpa
     JOIN utilizador u ON u.id = tpa.subscrito_id
     WHERE tpa.topico_id = ? AND tpa.status = 'pendente'
     ORDER BY tpa.solicitado_em ASC`,
    [topicoId],
  )
  res.json({ pedidos: rows })
}

// ── PATCH /api/topicos/:id/pedidos-acesso/:pedidoId ───────────────────────────
// Aprovar ou rejeitar — apenas o criador do tópico
export async function responderPedidoAcesso(req: Request, res: Response) {
  const userId   = req.user!.userId
  const topicoId = Number(req.params.id)
  const pedidoId = Number(req.params.pedidoId)
  const { acao } = req.body ?? {} // 'aprovar' | 'rejeitar'

  if (!['aprovar', 'rejeitar'].includes(acao)) {
    return res.status(400).json({ message: 'Acção inválida. Use "aprovar" ou "rejeitar".' })
  }

  const role = req.user!.role
  const isAdmin = role === 'admin' || role === 'superadmin'

  const [dono] = await pool.query<RowDataPacket[]>(
    'SELECT criado_por, titulo FROM topico_forum WHERE id = ? LIMIT 1', [topicoId],
  )
  if (!dono[0]) return res.status(404).json({ message: 'Tópico não encontrado.' })
  if (dono[0]['criado_por'] !== userId && !isAdmin) return res.status(403).json({ message: 'Sem permissão.' })

  const novoStatus = acao === 'aprovar' ? 'aprovado' : 'rejeitado'

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE topico_privado_acesso SET status = ?, admin_responsavel = ? WHERE id = ? AND topico_id = ?`,
    [novoStatus, userId, pedidoId, topicoId],
  )
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Pedido não encontrado.' })

  // Notifica o solicitante
  const [pedido] = await pool.query<RowDataPacket[]>(
    'SELECT subscrito_id FROM topico_privado_acesso WHERE id = ? LIMIT 1', [pedidoId],
  )
  if (pedido[0]) {
    const tipo = acao === 'aprovar' ? 'acesso_topico_aprovado' : 'pedido_acesso_topico'
    const titulo = acao === 'aprovar' ? 'Acesso aprovado!' : 'Pedido de acesso rejeitado'
    const mensagem = acao === 'aprovar'
      ? `O teu pedido de acesso ao tópico "${dono[0]['titulo']}" foi aprovado.`
      : `O teu pedido de acesso ao tópico "${dono[0]['titulo']}" foi rejeitado.`
    await pool.query(
      `INSERT INTO notificacao (usuario_id, tipo, entidade_id, titulo, mensagem, link_destino)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [pedido[0]['subscrito_id'], tipo, topicoId, titulo, mensagem, `/forum?topico=${topicoId}`],
    )
  }

  res.json({ message: acao === 'aprovar' ? 'Acesso aprovado.' : 'Pedido rejeitado.' })
}

// ── POST /api/topicos/:id/votar ───────────────────────────────────────────────
// body: { valor: 1 | -1 }. Idempotente (toggle) via forumVote.service.
export async function votarTopico(req: Request, res: Response) {
  const userId   = req.user!.userId
  const topicoId = Number(req.params.id)
  try {
    const resultado = await registarVoto(
      { votoTabela: 'voto_topico', idColuna: 'topico_id', alvoTabela: 'topico_forum' },
      topicoId, userId, Number(req.body?.valor),
    )
    return res.json(resultado)
  } catch (err) {
    return res.status(400).json({ message: (err as Error).message })
  }
}

// ── POST /api/topicos/:id/fixar ───────────────────────────────────────────────
// Alterna o estado "fixado" (apenas admin).
export async function fixarTopico(req: Request, res: Response) {
  const topicoId = Number(req.params.id)
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT fixado FROM topico_forum WHERE id = ? LIMIT 1', [topicoId],
  )
  if (!rows[0]) return res.status(404).json({ message: 'Tópico não encontrado.' })

  const novo = rows[0]['fixado'] ? 0 : 1
  await pool.query('UPDATE topico_forum SET fixado = ? WHERE id = ?', [novo, topicoId])
  return res.json({ fixado: novo })
}

// ── POST /api/topicos/:id/fechar ─────────────────────────────────────────────
// Toggle: fecha ou reabre o tópico. Só o criador ou admin.
export async function fecharTopico(req: Request, res: Response) {
  const userId   = req.user!.userId
  const role     = req.user!.role
  const topicoId = Number(req.params.id)

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT criado_por, fechado FROM topico_forum WHERE id = ? LIMIT 1', [topicoId],
  )
  const topico = rows[0]
  if (!topico) return res.status(404).json({ message: 'Tópico não encontrado.' })

  const isAdmin = role === 'admin' || role === 'superadmin'
  if (!isAdmin && topico['criado_por'] !== userId) {
    return res.status(403).json({ message: 'Só o criador do tópico ou um administrador pode fechá-lo.' })
  }

  const novo = topico['fechado'] ? 0 : 1
  await pool.query('UPDATE topico_forum SET fechado = ? WHERE id = ?', [novo, topicoId])
  return res.json({ fechado: novo })
}

// ── POST /api/topicos/:id/resolver ────────────────────────────────────────────
// body: { resposta_aceite_id: number | null }. Só o autor do tópico ou um admin.
// Passar null limpa a resolução.
export async function resolverTopico(req: Request, res: Response) {
  const userId   = req.user!.userId
  const role     = req.user!.role
  const topicoId = Number(req.params.id)
  const { resposta_aceite_id = null } = req.body ?? {}

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT criado_por FROM topico_forum WHERE id = ? LIMIT 1', [topicoId],
  )
  const topico = rows[0]
  if (!topico) return res.status(404).json({ message: 'Tópico não encontrado.' })

  const isAdmin = role === 'admin' || role === 'superadmin'
  if (!isAdmin && topico['criado_por'] !== userId) {
    return res.status(403).json({ message: 'Só o autor do tópico ou um administrador pode marcar a solução.' })
  }

  if (resposta_aceite_id == null) {
    await pool.query('UPDATE topico_forum SET resolvido = 0, resposta_aceite_id = NULL WHERE id = ?', [topicoId])
    return res.json({ resolvido: 0, resposta_aceite_id: null })
  }

  const [resp] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM resposta_forum WHERE id = ? AND topico_id = ? LIMIT 1',
    [resposta_aceite_id, topicoId],
  )
  if (!resp[0]) return res.status(400).json({ message: 'Essa resposta não pertence a este tópico.' })

  await pool.query(
    'UPDATE topico_forum SET resolvido = 1, resposta_aceite_id = ? WHERE id = ?',
    [resposta_aceite_id, topicoId],
  )
  return res.json({ resolvido: 1, resposta_aceite_id: Number(resposta_aceite_id) })
}
