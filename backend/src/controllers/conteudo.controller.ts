import type { Request, Response } from 'express'
import { pool } from '../config/database.js'
import type { ResultSetHeader } from 'mysql2'
import { conteudoRepository } from '../repositories/conteudo.repository.js'
import { eventBus } from '../services/events.service.js'

function toBoolean(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true'
}

export async function listConteudos(_req: Request, res: Response) {
  const rows = await conteudoRepository.findAll()
  res.json(rows)
}

export async function getConteudoById(req: Request, res: Response) {
  const conteudo = await conteudoRepository.findById(String(req.params.id))
  if (!conteudo) return res.status(404).json({ message: 'Conteúdo não encontrado' })
  return res.json(conteudo)
}

export async function createConteudo(req: Request, res: Response) {
  const {
    titulo,
    descricao = null,
    conteudo_completo = null,
    tipo,
    categoria = null,
    tema = null,
    duracao = null,
    url_recurso = null,
    recurso_filename = null,
    imagem_filename = null,
    video_filename = null,
    apresentador = null,
    categoria_podcast = null,
    cache_offline = false,
    publicado_por = null,
  } = req.body ?? {}

  if (!titulo || !tipo) {
    return res.status(400).json({ message: 'titulo e tipo são obrigatórios' })
  }

  const row = await conteudoRepository.create({
    titulo,
    descricao,
    conteudoCompleto: conteudo_completo,
    tipo,
    categoria,
    tema,
    duracao,
    urlRecurso: url_recurso,
    recursoFilename: recurso_filename,
    imagemFilename: imagem_filename,
    videoFilename: video_filename,
    apresentador,
    categoriaPodcast: categoria_podcast,
    cacheOffline: toBoolean(cache_offline),
    publicadoPor: publicado_por,
  })

  return res.status(201).json(row)
}

export async function updateConteudo(req: Request, res: Response) {
  const id = String(req.params.id)
  const fields = req.body ?? {}

  const allowedFields = [
    'titulo', 'descricao', 'conteudo_completo', 'tipo', 'categoria', 'tema', 'duracao',
    'url_recurso', 'recurso_filename', 'imagem_filename', 'video_filename', 'apresentador',
    'categoria_podcast', 'cache_offline', 'publicado_por',
  ] as const

  const updates: string[] = []
  const values: unknown[] = []

  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      updates.push(`${key} = ?`)
      values.push(key === 'cache_offline' ? (toBoolean(fields[key]) ? 1 : 0) : fields[key])
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'Nenhum campo para atualizar' })
  }

  values.push(id)
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE conteudo SET ${updates.join(', ')} WHERE id = ?`,
    values,
  )

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Conteúdo não encontrado' })
  }

  const row = await conteudoRepository.findById(id)
  return res.json(row)
}

export async function deleteConteudo(req: Request, res: Response) {
  const userId = req.user!.userId
  const role   = req.user!.role
  const id     = String(req.params.id)

  const row = await conteudoRepository.findById(id)
  if (!row) return res.status(404).json({ message: 'Conteúdo não encontrado' })

  const isAdmin = role === 'admin' || role === 'superadmin'
  if (!isAdmin && row.publicado_por !== userId) {
    return res.status(403).json({ message: 'Apenas o autor ou um administrador pode apagar este conteúdo.' })
  }

  await conteudoRepository.delete(id)
  return res.status(204).send()
}

// ── POST /api/conteudos/:id/solicitar-acesso ──────────────────────────────────
export async function solicitarAcessoJindungo(req: Request, res: Response) {
  const userId     = (req as any).user?.userId
  const conteudoId = Number(req.params.id)
  const { motivo = null } = req.body ?? {}

  if (!userId) return res.status(401).json({ message: 'Não autenticado.' })

  try {
    await pool.query(
      `INSERT INTO solicitacao_acesso_jindungo (subscrito_id, conteudo_id, motivo)
       VALUES (?, ?, ?)`,
      [userId, conteudoId, motivo],
    )
    eventBus.emit('acesso:solicitado', { userId, conteudoId: String(conteudoId) })
    return res.status(201).json({ message: 'Solicitação enviada. Aguarda aprovação do administrador.' })
  } catch (err: any) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Já enviaste uma solicitação para este conteúdo.' })
    }
    console.error('solicitarAcessoJindungo:', err)
    return res.status(500).json({ message: 'Erro interno do servidor.' })
  }
}
