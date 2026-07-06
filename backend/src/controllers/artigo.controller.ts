/**
 * artigo.controller.ts
 * Gestão de Artigos com Blocos de Conteúdo Rico
 *
 * Permissões:
 *  - Leitura pública: artigos publicados acessíveis a todos
 *  - Criação/edição: apenas admin ou utilizadores com permissão explícita
 *  - Gestão de permissões: apenas admin
 */
import type { Request, Response } from 'express'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { pool } from '../config/database.js'

// ── Tipos internos ────────────────────────────────────────────────────────────
type ArtigoRow = RowDataPacket & {
  id: number
  titulo: string
  subtitulo: string | null
  slug: string
  resumo: string | null
  capa_url: string | null
  categoria: string | null
  tags: string | null       // JSON serializado
  status: 'rascunho' | 'publicado' | 'arquivado'
  destaque: number
  autor_id: number
  autor_nome: string
  visualizacoes: number
  tempo_leitura: number
  criado_em: string
  atualizado_em: string
  publicado_em: string | null
}

type BlocoRow = RowDataPacket & {
  id: number
  artigo_id: number
  tipo: string
  conteudo: string | null
  url: string | null
  filename: string | null
  legenda: string | null
  alt_text: string | null
  alinhamento: string
  largura: string
  ordem: number
  meta: string | null
}

// ── Utilitários ───────────────────────────────────────────────────────────────

/** Gera slug a partir do título */
function slugify(titulo: string): string {
  return titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 250)
}

/** Garante slug único na base de dados */
async function ensureUniqueSlug(base: string, excludeId?: number): Promise<string> {
  let slug = base
  let attempt = 0
  while (true) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM artigo WHERE slug = ?${excludeId ? ' AND id != ?' : ''} LIMIT 1`,
      excludeId ? [candidate, excludeId] : [candidate],
    )
    if ((rows as RowDataPacket[]).length === 0) return candidate
    attempt++
  }
}

/** Verifica se o utilizador tem permissão para criar/editar artigos */
async function hasArtigoPermission(userId: number): Promise<boolean> {
  // Admin sempre tem permissão
  const [userRows] = await pool.query<RowDataPacket[]>(
    'SELECT tipo FROM utilizador WHERE id = ? LIMIT 1',
    [userId],
  )
  if (!userRows[0]) return false
  if (userRows[0]?.['tipo'] === 'admin' || userRows[0]?.['tipo'] === 'superadmin') return true

  // Verificar permissão explícita
  const [permRows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM artigo_autor_permitido WHERE utilizador_id = ? AND ativo = TRUE LIMIT 1',
    [userId],
  )
  return (permRows as RowDataPacket[]).length > 0
}

/** Verifica se utilizador pode publicar (não só rascunho) */
async function canPublish(userId: number): Promise<boolean> {
  const [userRows] = await pool.query<RowDataPacket[]>(
    'SELECT tipo FROM utilizador WHERE id = ? LIMIT 1',
    [userId],
  )
  if (userRows[0]?.['tipo'] === 'admin' || userRows[0]?.['tipo'] === 'superadmin') return true

  const [permRows] = await pool.query<RowDataPacket[]>(
    'SELECT pode_publicar FROM artigo_autor_permitido WHERE utilizador_id = ? AND ativo = TRUE LIMIT 1',
    [userId],
  )
  return permRows[0]?.['pode_publicar'] === 1 || permRows[0]?.['pode_publicar'] === true
}

/** Calcula tempo de leitura estimado com base nos blocos de texto */
function estimarTempoLeitura(blocos: { tipo: string; conteudo?: string | null }[]): number {
  const palavrasPorMinuto = 200
  let totalPalavras = 0
  for (const b of blocos) {
    if (['paragrafo', 'titulo_secao', 'subtitulo_secao', 'citacao', 'destaque', 'lista'].includes(b.tipo)) {
      const texto = (b.conteudo ?? '').replace(/<[^>]+>/g, ' ')
      totalPalavras += texto.split(/\s+/).filter(Boolean).length
    }
  }
  return Math.max(1, Math.ceil(totalPalavras / palavrasPorMinuto))
}

// ── GET /api/artigos ──────────────────────────────────────────────────────────
/** Lista artigos publicados (público) */
export async function listArtigos(req: Request, res: Response) {
  const limite  = Math.min(Number(req.query['limit']  ?? 20), 100)
  const offset  = Number(req.query['offset'] ?? 0)
  const categoria = req.query['categoria'] as string | undefined
  const busca     = req.query['q']         as string | undefined
  const destaque  = req.query['destaque']  as string | undefined

  const where: string[] = ['a.status = "publicado"']
  const params: unknown[] = []

  if (categoria) { where.push('a.categoria = ?'); params.push(categoria) }
  if (busca)     { where.push('(a.titulo LIKE ? OR a.resumo LIKE ?)'); params.push(`%${busca}%`, `%${busca}%`) }
  if (destaque)  { where.push('a.destaque = 1') }

  const [rows] = await pool.query<ArtigoRow[]>(
    `SELECT a.*, u.nome AS autor_nome
     FROM artigo a
     JOIN utilizador u ON u.id = a.autor_id
     WHERE ${where.join(' AND ')}
     ORDER BY a.destaque DESC, a.publicado_em DESC
     LIMIT ? OFFSET ?`,
    [...params, limite, offset],
  )

  const [count] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM artigo a WHERE ${where.join(' AND ')}`,
    params,
  )

  return res.json({
    artigos: rows.map(r => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [], destaque: Boolean(r.destaque) })),
    total: (count as RowDataPacket[])[0]?.['total'] ?? 0,
  })
}

// ── GET /api/artigos/admin/todos ──────────────────────────────────────────────
/** Lista TODOS os artigos (admin + autores permitidos) */
export async function listArtigosAdmin(req: Request, res: Response) {
  const userId = (req as Request & { user?: { id: number } }).user?.id
  if (!userId) return res.status(401).json({ message: 'Não autenticado.' })

  const isAdmin = await (async () => {
    const [r] = await pool.query<RowDataPacket[]>('SELECT tipo FROM utilizador WHERE id = ? LIMIT 1', [userId])
    return r[0]?.['tipo'] === 'admin' || r[0]?.['tipo'] === 'superadmin'
  })()

  const where: string[] = []
  const params: unknown[] = []

  if (!isAdmin) {
    // Autores só veem os seus próprios artigos
    where.push('a.autor_id = ?')
    params.push(userId)
  }

  const limite = Math.min(Number(req.query['limit'] ?? 50), 200)
  const offset = Number(req.query['offset'] ?? 0)
  const status = req.query['status'] as string | undefined
  if (status) { where.push('a.status = ?'); params.push(status) }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const [rows] = await pool.query<ArtigoRow[]>(
    `SELECT a.*, u.nome AS autor_nome
     FROM artigo a
     JOIN utilizador u ON u.id = a.autor_id
     ${whereClause}
     ORDER BY a.atualizado_em DESC
     LIMIT ? OFFSET ?`,
    [...params, limite, offset],
  )

  return res.json(rows.map(r => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [], destaque: Boolean(r.destaque) })))
}

// ── GET /api/artigos/:slug ────────────────────────────────────────────────────
export async function getArtigoBySlug(req: Request, res: Response) {
  const { slug } = req.params
  const userId = (req as Request & { user?: { id: number } }).user?.id

  const [rows] = await pool.query<ArtigoRow[]>(
    `SELECT a.*, u.nome AS autor_nome
     FROM artigo a
     JOIN utilizador u ON u.id = a.autor_id
     WHERE a.slug = ? LIMIT 1`,
    [slug],
  )

  const artigo = rows[0]
  if (!artigo) return res.status(404).json({ message: 'Artigo não encontrado.' })

  // Rascunhos só visíveis pelo próprio autor ou admin
  if (artigo.status !== 'publicado') {
    if (!userId) return res.status(403).json({ message: 'Acesso negado.' })
    const isAdmin = await (async () => {
      const [r] = await pool.query<RowDataPacket[]>('SELECT tipo FROM utilizador WHERE id = ? LIMIT 1', [userId])
      return r[0]?.['tipo'] === 'admin' || r[0]?.['tipo'] === 'superadmin'
    })()
    if (!isAdmin && artigo.autor_id !== userId) {
      return res.status(403).json({ message: 'Acesso negado.' })
    }
  }

  // Incrementar visualizações
  if (artigo.status === 'publicado') {
    await pool.query('UPDATE artigo SET visualizacoes = visualizacoes + 1 WHERE id = ?', [artigo.id])
  }

  // Buscar blocos
  const [blocos] = await pool.query<BlocoRow[]>(
    'SELECT * FROM artigo_bloco WHERE artigo_id = ? ORDER BY ordem ASC',
    [artigo.id],
  )

  return res.json({
    ...artigo,
    tags: artigo.tags ? JSON.parse(artigo.tags) : [],
    destaque: Boolean(artigo.destaque),
    blocos: (blocos as BlocoRow[]).map(b => ({ ...b, meta: b.meta ? JSON.parse(b.meta) : null })),
  })
}

// ── GET /api/artigos/id/:id ───────────────────────────────────────────────────
export async function getArtigoById(req: Request, res: Response) {
  const { id } = req.params
  const userId = (req as Request & { user?: { id: number } }).user?.id

  const [rows] = await pool.query<ArtigoRow[]>(
    `SELECT a.*, u.nome AS autor_nome FROM artigo a JOIN utilizador u ON u.id = a.autor_id WHERE a.id = ? LIMIT 1`,
    [id],
  )

  const artigo = rows[0]
  if (!artigo) return res.status(404).json({ message: 'Artigo não encontrado.' })

  if (artigo.status !== 'publicado' && (!userId || (artigo.autor_id !== userId))) {
    const isAdmin = userId ? await (async () => {
      const [r] = await pool.query<RowDataPacket[]>('SELECT tipo FROM utilizador WHERE id = ? LIMIT 1', [userId])
      return r[0]?.['tipo'] === 'admin' || r[0]?.['tipo'] === 'superadmin'
    })() : false
    if (!isAdmin) return res.status(403).json({ message: 'Acesso negado.' })
  }

  const [blocos] = await pool.query<BlocoRow[]>(
    'SELECT * FROM artigo_bloco WHERE artigo_id = ? ORDER BY ordem ASC',
    [artigo.id],
  )

  return res.json({
    ...artigo,
    tags: artigo.tags ? JSON.parse(artigo.tags) : [],
    destaque: Boolean(artigo.destaque),
    blocos: (blocos as BlocoRow[]).map(b => ({ ...b, meta: b.meta ? JSON.parse(b.meta) : null })),
  })
}

// ── POST /api/artigos ─────────────────────────────────────────────────────────
export async function createArtigo(req: Request, res: Response) {
  const userId = (req as Request & { user?: { id: number } }).user?.id
  if (!userId) return res.status(401).json({ message: 'Não autenticado.' })

  const hasPerm = await hasArtigoPermission(userId)
  if (!hasPerm) return res.status(403).json({ message: 'Sem permissão para criar artigos.' })

  const { titulo, subtitulo, resumo, capa_url, categoria, tags = [], status = 'rascunho', destaque = false, blocos = [] } = req.body ?? {}

  if (!titulo) return res.status(400).json({ message: 'O título é obrigatório.' })

  // Verificar permissão de publicação
  if (status === 'publicado') {
    const pode = await canPublish(userId)
    if (!pode) return res.status(403).json({ message: 'Sem permissão para publicar directamente. Guarde como rascunho.' })
  }

  const slug = await ensureUniqueSlug(slugify(titulo))
  const tempoLeitura = estimarTempoLeitura(blocos)

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO artigo (titulo, subtitulo, slug, resumo, capa_url, categoria, tags, status, destaque, autor_id, tempo_leitura, publicado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titulo, subtitulo ?? null, slug, resumo ?? null, capa_url ?? null,
        categoria ?? null, JSON.stringify(tags), status,
        destaque ? 1 : 0, userId, tempoLeitura,
        status === 'publicado' ? new Date() : null,
      ],
    )

    const artigoId = result.insertId

    // Inserir blocos
    if (Array.isArray(blocos) && blocos.length > 0) {
      for (let i = 0; i < blocos.length; i++) {
        const b = blocos[i] as Record<string, unknown>
        await conn.query(
          `INSERT INTO artigo_bloco (artigo_id, tipo, conteudo, url, filename, legenda, alt_text, alinhamento, largura, ordem, meta)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            artigoId, b['tipo'] ?? 'paragrafo', b['conteudo'] ?? null,
            b['url'] ?? null, b['filename'] ?? null, b['legenda'] ?? null,
            b['alt_text'] ?? null, b['alinhamento'] ?? 'esquerda',
            b['largura'] ?? 'normal', i, b['meta'] ? JSON.stringify(b['meta']) : null,
          ],
        )
      }
    }

    await conn.commit()

    const [rows] = await pool.query<ArtigoRow[]>('SELECT * FROM artigo WHERE id = ? LIMIT 1', [artigoId])
    return res.status(201).json({ ...rows[0], tags: rows[0] ? JSON.parse(rows[0].tags ?? '[]') : [], slug })
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ── PUT /api/artigos/:id ──────────────────────────────────────────────────────
export async function updateArtigo(req: Request, res: Response) {
  const userId = (req as Request & { user?: { id: number } }).user?.id
  if (!userId) return res.status(401).json({ message: 'Não autenticado.' })

  const [existing] = await pool.query<ArtigoRow[]>('SELECT * FROM artigo WHERE id = ? LIMIT 1', [req.params['id']])
  const artigo = existing[0]
  if (!artigo) return res.status(404).json({ message: 'Artigo não encontrado.' })

  // Verificar permissão: admin pode editar tudo; autor só o seu
  const isAdmin = await (async () => {
    const [r] = await pool.query<RowDataPacket[]>('SELECT tipo FROM utilizador WHERE id = ? LIMIT 1', [userId])
    return r[0]?.['tipo'] === 'admin' || r[0]?.['tipo'] === 'superadmin'
  })()

  if (!isAdmin && artigo.autor_id !== userId) {
    return res.status(403).json({ message: 'Sem permissão para editar este artigo.' })
  }

  const { titulo, subtitulo, resumo, capa_url, categoria, tags, status, destaque, blocos } = req.body ?? {}

  // Verificar permissão de publicação
  if (status === 'publicado' && artigo.status !== 'publicado') {
    const pode = await canPublish(userId)
    if (!pode) return res.status(403).json({ message: 'Sem permissão para publicar. Guarde como rascunho.' })
  }

  let slug = artigo.slug
  if (titulo && titulo !== artigo.titulo) {
    slug = await ensureUniqueSlug(slugify(titulo), artigo.id)
  }

  const tempoLeitura = blocos ? estimarTempoLeitura(blocos) : artigo.tempo_leitura
  const publicadoEm = status === 'publicado' && artigo.status !== 'publicado'
    ? new Date()
    : artigo.publicado_em

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    await conn.query(
      `UPDATE artigo SET
         titulo = COALESCE(?, titulo),
         subtitulo = ?,
         slug = ?,
         resumo = ?,
         capa_url = ?,
         categoria = COALESCE(?, categoria),
         tags = COALESCE(?, tags),
         status = COALESCE(?, status),
         destaque = COALESCE(?, destaque),
         tempo_leitura = ?,
         publicado_em = COALESCE(?, publicado_em),
         atualizado_em = NOW()
       WHERE id = ?`,
      [
        titulo ?? null, subtitulo ?? null, slug,
        resumo ?? null, capa_url ?? null, categoria ?? null,
        tags ? JSON.stringify(tags) : null, status ?? null,
        destaque !== undefined ? (destaque ? 1 : 0) : null,
        tempoLeitura, publicadoEm ?? null, artigo.id,
      ],
    )

    // Re-sincronizar blocos se enviados
    if (Array.isArray(blocos)) {
      await conn.query('DELETE FROM artigo_bloco WHERE artigo_id = ?', [artigo.id])
      for (let i = 0; i < blocos.length; i++) {
        const b = blocos[i] as Record<string, unknown>
        await conn.query(
          `INSERT INTO artigo_bloco (artigo_id, tipo, conteudo, url, filename, legenda, alt_text, alinhamento, largura, ordem, meta)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            artigo.id, b['tipo'] ?? 'paragrafo', b['conteudo'] ?? null,
            b['url'] ?? null, b['filename'] ?? null, b['legenda'] ?? null,
            b['alt_text'] ?? null, b['alinhamento'] ?? 'esquerda',
            b['largura'] ?? 'normal', i, b['meta'] ? JSON.stringify(b['meta']) : null,
          ],
        )
      }
    }

    await conn.commit()

    const [rows] = await pool.query<ArtigoRow[]>('SELECT * FROM artigo WHERE id = ? LIMIT 1', [artigo.id])
    return res.json({ ...rows[0], tags: rows[0] ? JSON.parse(rows[0].tags ?? '[]') : [], slug })
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ── DELETE /api/artigos/:id ───────────────────────────────────────────────────
export async function deleteArtigo(req: Request, res: Response) {
  const userId = (req as Request & { user?: { id: number } }).user?.id
  if (!userId) return res.status(401).json({ message: 'Não autenticado.' })

  const [existing] = await pool.query<ArtigoRow[]>('SELECT * FROM artigo WHERE id = ? LIMIT 1', [req.params['id']])
  const artigo = existing[0]
  if (!artigo) return res.status(404).json({ message: 'Artigo não encontrado.' })

  const isAdmin = await (async () => {
    const [r] = await pool.query<RowDataPacket[]>('SELECT tipo FROM utilizador WHERE id = ? LIMIT 1', [userId])
    return r[0]?.['tipo'] === 'admin' || r[0]?.['tipo'] === 'superadmin'
  })()

  if (!isAdmin && artigo.autor_id !== userId) {
    return res.status(403).json({ message: 'Sem permissão para apagar este artigo.' })
  }

  await pool.query('DELETE FROM artigo WHERE id = ?', [artigo.id])
  return res.json({ message: 'Artigo apagado com sucesso.' })
}

// ── GET /api/artigos/admin/autores-permitidos ─────────────────────────────────
export async function listAutoresPermitidos(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT aap.*, u.nome, u.email, u.avatar_url, u.tipo AS user_tipo,
            adm.nome AS permitido_por_nome
     FROM artigo_autor_permitido aap
     JOIN utilizador u   ON u.id   = aap.utilizador_id
     JOIN utilizador adm ON adm.id = aap.permitido_por
     ORDER BY aap.concedido_em DESC`,
  )
  return res.json(rows)
}

// ── POST /api/artigos/admin/autores-permitidos ────────────────────────────────
export async function addAutorPermitido(req: Request, res: Response) {
  const adminId = (req as Request & { user?: { id: number } }).user?.id
  if (!adminId) return res.status(401).json({ message: 'Não autenticado.' })

  const { utilizador_id, pode_publicar = false, observacoes } = req.body ?? {}
  if (!utilizador_id) return res.status(400).json({ message: 'utilizador_id é obrigatório.' })

  // Verificar se já existe; se sim, reativar
  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM artigo_autor_permitido WHERE utilizador_id = ? LIMIT 1',
    [utilizador_id],
  )

  if ((existing as RowDataPacket[]).length > 0) {
    await pool.query(
      'UPDATE artigo_autor_permitido SET ativo = TRUE, pode_publicar = ?, observacoes = ?, permitido_por = ?, revogado_em = NULL WHERE utilizador_id = ?',
      [pode_publicar ? 1 : 0, observacoes ?? null, adminId, utilizador_id],
    )
  } else {
    await pool.query(
      'INSERT INTO artigo_autor_permitido (utilizador_id, permitido_por, ativo, pode_publicar, observacoes) VALUES (?, ?, TRUE, ?, ?)',
      [utilizador_id, adminId, pode_publicar ? 1 : 0, observacoes ?? null],
    )
  }

  return res.json({ message: 'Permissão concedida com sucesso.' })
}

// ── DELETE /api/artigos/admin/autores-permitidos/:id ─────────────────────────
export async function removeAutorPermitido(req: Request, res: Response) {
  await pool.query(
    'UPDATE artigo_autor_permitido SET ativo = FALSE, revogado_em = NOW() WHERE utilizador_id = ?',
    [req.params['id']],
  )
  return res.json({ message: 'Permissão revogada.' })
}

// ── PATCH /api/artigos/:id/publicar ──────────────────────────────────────────
export async function publicarArtigo(req: Request, res: Response) {
  const userId = (req as Request & { user?: { id: number } }).user?.id
  if (!userId) return res.status(401).json({ message: 'Não autenticado.' })

  const pode = await canPublish(userId)
  if (!pode) return res.status(403).json({ message: 'Sem permissão para publicar artigos.' })

  const [existing] = await pool.query<ArtigoRow[]>('SELECT * FROM artigo WHERE id = ? LIMIT 1', [req.params['id']])
  const artigo = existing[0]
  if (!artigo) return res.status(404).json({ message: 'Artigo não encontrado.' })

  await pool.query(
    'UPDATE artigo SET status = "publicado", publicado_em = NOW() WHERE id = ?',
    [artigo.id],
  )

  return res.json({ message: 'Artigo publicado com sucesso.' })
}

// ── PATCH /api/artigos/:id/arquivar ──────────────────────────────────────────
export async function arquivarArtigo(req: Request, res: Response) {
  const userId = (req as Request & { user?: { id: number } }).user?.id
  if (!userId) return res.status(401).json({ message: 'Não autenticado.' })

  const [existing] = await pool.query<ArtigoRow[]>('SELECT * FROM artigo WHERE id = ? LIMIT 1', [req.params['id']])
  const artigo = existing[0]
  if (!artigo) return res.status(404).json({ message: 'Artigo não encontrado.' })

  const isAdmin = await (async () => {
    const [r] = await pool.query<RowDataPacket[]>('SELECT tipo FROM utilizador WHERE id = ? LIMIT 1', [userId])
    return r[0]?.['tipo'] === 'admin' || r[0]?.['tipo'] === 'superadmin'
  })()

  if (!isAdmin && artigo.autor_id !== userId) {
    return res.status(403).json({ message: 'Sem permissão.' })
  }

  await pool.query('UPDATE artigo SET status = "arquivado" WHERE id = ?', [artigo.id])
  return res.json({ message: 'Artigo arquivado.' })
}

// ── GET /api/artigos/minha-permissao ─────────────────────────────────────────
/** Devolve se o utilizador autenticado pode criar artigos e se pode publicar */
export async function minhaPermissao(req: Request, res: Response) {
  const userId = (req as Request & { user?: { id: number } }).user?.id
  if (!userId) return res.json({ permitido: false, pode_publicar: false })

  const [userRows] = await pool.query<RowDataPacket[]>(
    'SELECT tipo FROM utilizador WHERE id = ? LIMIT 1',
    [userId],
  )

  // Admin tem sempre permissão total
  if (userRows[0]?.['tipo'] === 'admin' || userRows[0]?.['tipo'] === 'superadmin') {
    return res.json({ permitido: true, pode_publicar: true })
  }

  // Verificar permissão explícita
  const [permRows] = await pool.query<RowDataPacket[]>(
    'SELECT pode_publicar FROM artigo_autor_permitido WHERE utilizador_id = ? AND ativo = TRUE LIMIT 1',
    [userId],
  )

  if ((permRows as RowDataPacket[]).length === 0) {
    return res.json({ permitido: false, pode_publicar: false })
  }

  return res.json({
    permitido: true,
    pode_publicar: permRows[0]?.['pode_publicar'] === 1 || permRows[0]?.['pode_publicar'] === true,
  })
}
