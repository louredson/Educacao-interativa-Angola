import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'
import * as ContentModel from '../models/content.model.js'
import { pool } from '../config/database.js'
import { criarNotificacao, notificarAdmins } from '../services/notificacao.service.js'

export async function uploadConteudoFicheiro(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ erro: 'Nenhum ficheiro enviado.' })
    return
  }
  res.status(201).json({ url: `/uploads/content/${req.file.filename}` })
}

export async function listarConteudos(req: Request, res: Response): Promise<void> {
  try {
    const conteudos = await ContentModel.findAllConteudos()
    res.status(200).json({ conteudos })
  } catch (error) {
    console.error('Erro ao listar conteúdos:', error)
    res.status(500).json({ erro: 'Erro interno ao obter conteúdos.' })
  }
}

const TIPOS_VALIDOS = ['video', 'texto_normal', 'texto_jindungo', 'podcast']

export async function criarConteudo(req: Request, res: Response): Promise<void> {
  try {
    const {
      titulo, descricao, conteudo_completo, tipo, categoria,
      duracao, url_recurso, imagem_filename, apresentador, categoria_podcast,
    } = req.body ?? {}

    if (!titulo?.trim() || !tipo) {
      res.status(400).json({ erro: 'titulo e tipo são obrigatórios.' })
      return
    }
    if (!TIPOS_VALIDOS.includes(tipo)) {
      res.status(400).json({ erro: 'tipo inválido.' })
      return
    }

    const conteudo = await ContentModel.createConteudo({
      titulo: titulo.trim(),
      descricao: descricao ?? null,
      conteudo_completo: conteudo_completo ?? null,
      tipo,
      categoria: categoria ?? null,
      duracao: duracao ?? null,
      url_recurso: url_recurso ?? null,
      imagem_filename: imagem_filename ?? null,
      apresentador: apresentador ?? null,
      categoria_podcast: categoria_podcast ?? null,
      publicado_por: req.user!.userId,
    })

    res.status(201).json({ conteudo })
  } catch (error) {
    console.error('Erro ao criar conteúdo:', error)
    res.status(500).json({ erro: 'Erro interno ao criar conteúdo.' })
  }
}

export async function atualizarConteudo(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id))
    if (isNaN(id)) {
      res.status(400).json({ erro: 'ID inválido.' })
      return
    }
    if (req.body?.tipo && !TIPOS_VALIDOS.includes(req.body.tipo)) {
      res.status(400).json({ erro: 'tipo inválido.' })
      return
    }

    // A edição de conteúdo é exclusiva de quem o criou (o professor) — o
    // admin deixou de publicar/gerir conteúdo directamente.
    const existente = await ContentModel.findConteudoById(id)
    if (!existente) {
      res.status(404).json({ erro: 'Conteúdo não encontrado.' })
      return
    }
    if (existente.publicado_por !== req.user!.userId) {
      res.status(403).json({ erro: 'Só o criador deste conteúdo pode editá-lo.' })
      return
    }

    const conteudo = await ContentModel.updateConteudo(id, req.body ?? {})
    if (!conteudo) {
      res.status(404).json({ erro: 'Conteúdo não encontrado.' })
      return
    }
    res.status(200).json({ conteudo })
  } catch (error) {
    console.error('Erro ao atualizar conteúdo:', error)
    res.status(500).json({ erro: 'Erro interno ao atualizar conteúdo.' })
  }
}

export async function removerConteudo(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id))
    if (isNaN(id)) {
      res.status(400).json({ erro: 'ID inválido.' })
      return
    }
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'superadmin'
    const sucesso = await ContentModel.deleteConteudo(id, req.user!.userId, isAdmin)
    if (!sucesso) {
      res.status(404).json({ erro: 'Conteúdo não encontrado ou sem permissão.' })
      return
    }
    res.status(200).json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao remover conteúdo:', error)
    res.status(500).json({ erro: 'Erro interno ao remover conteúdo.' })
  }
}

export async function obterEstadoUsuario(req: Request, res: Response): Promise<void> {
  try {
    const usuarioId = req.user!.userId
    const estado = await ContentModel.getEstadoConteudosUsuario(usuarioId)
    const toIso = (value: any) => value ? new Date(value).toISOString() : null

    res.status(200).json({
      likedContents: Object.fromEntries(
        estado.reacoes
          .filter((row: any) => row.tipo === 'like')
          .map((row: any) => [String(row.conteudo_id), true])
      ),
      dislikedContents: Object.fromEntries(
        estado.reacoes
          .filter((row: any) => row.tipo === 'dislike')
          .map((row: any) => [String(row.conteudo_id), true])
      ),
      savedContents: Object.fromEntries(
        estado.salvos.map((row: any) => [String(row.conteudo_id), true])
      ),
      accessRequested: Object.fromEntries(
        estado.acessos
          .filter((row: any) => row.status === 'pendente' || row.status === 'aprovado' || row.status === 'rejeitado')
          .map((row: any) => [
            String(row.conteudo_id),
            {
              status: row.status,
              requestedAt: toIso(row.solicitado_em),
              reviewedAt: toIso(row.respondido_em),
              reviewedBy: row.admin_nome || null,
              notes: row.observacoes_resposta || null,
            },
          ])
      ),
      reportedContents: Object.fromEntries(
        estado.denuncias.map((row: any) => [
          String(row.conteudo_id),
          {
            status: row.status,
            reportedAt: toIso(row.criada_em),
            reviewedAt: toIso(row.resolvido_em),
            reviewedBy: row.admin_nome || null,
            notes: row.observacoes_moderacao || null,
          },
        ])
      ),
    })
  } catch (error) {
    console.error('Erro ao obter estado do utilizador:', error)
    res.status(500).json({ erro: 'Erro interno ao obter estado do utilizador.' })
  }
}

export async function denunciarConteudo(req: Request, res: Response): Promise<void> {
  try {
    const conteudoId = parseInt(String(req.params.id))
    const { motivo, descricao } = req.body as { motivo?: string; descricao?: string }
    const motivoLimpo = motivo?.trim()

    if (isNaN(conteudoId) || !motivoLimpo) {
      res.status(400).json({ erro: 'Denúncia inválida.' })
      return
    }

    await ContentModel.criarDenunciaConteudo(
      conteudoId,
      req.user!.userId,
      motivoLimpo,
      descricao?.trim() || null
    )
    res.status(201).json({
      sucesso: true,
      report: {
        status: 'pendente',
        reportedAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        notes: null,
      },
    })
  } catch (error) {
    console.error('Erro ao denunciar conteúdo:', error)
    res.status(500).json({ erro: 'Erro interno ao denunciar conteúdo.' })
  }
}

export async function listarPedidosDoMeuConteudo(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId
    const [rows] = await (pool as any).query(
      `SELECT s.id, s.status, s.motivo, s.solicitado_em, s.respondido_em, s.observacoes_resposta,
              u.id AS usuario_id, u.nome AS usuario_nome, u.email AS usuario_email,
              c.id AS conteudo_id, c.titulo AS conteudo_titulo
       FROM solicitacao_acesso_jindungo s
       JOIN utilizador u ON u.id = s.subscrito_id
       JOIN conteudo   c ON c.id = s.conteudo_id
       WHERE c.publicado_por = ?
       ORDER BY s.solicitado_em DESC`,
      [userId],
    )
    res.status(200).json({ pedidos: rows })
  } catch (error) {
    console.error('Erro ao listar pedidos:', error)
    res.status(500).json({ erro: 'Erro interno ao listar pedidos.' })
  }
}

export async function responderPedidoAcesso(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId
    const pedidoId = parseInt(String(req.params.pedidoId))
    const { status, observacoes = null } = req.body ?? {}

    if (!['aprovado', 'rejeitado'].includes(status)) {
      res.status(400).json({ erro: 'status deve ser: aprovado ou rejeitado.' })
      return
    }

    // Verificar que o pedido é de um conteúdo criado por este utilizador
    const [rows] = await (pool as any).query(
      `SELECT s.*, c.titulo, c.publicado_por
       FROM solicitacao_acesso_jindungo s
       JOIN conteudo c ON c.id = s.conteudo_id
       WHERE s.id = ? LIMIT 1`,
      [pedidoId],
    )
    const pedido = (rows as any[])[0]
    if (!pedido) {
      res.status(404).json({ erro: 'Pedido não encontrado.' })
      return
    }
    if (pedido.publicado_por !== userId) {
      res.status(403).json({ erro: 'Só o criador do conteúdo pode responder a este pedido.' })
      return
    }

    await (pool as any).query(
      `UPDATE solicitacao_acesso_jindungo
       SET status = ?, admin_responsavel = ?, observacoes_resposta = ?, respondido_em = NOW()
       WHERE id = ?`,
      [status, userId, observacoes, pedidoId],
    )

    await criarNotificacao({
      usuarioId: pedido.subscrito_id,
      tipo: status === 'aprovado' ? 'acesso_jindungo_aprovado' : 'acesso_jindungo_rejeitado',
      entidadeId: pedido.conteudo_id,
      titulo: status === 'aprovado' ? 'Acesso aprovado' : 'Pedido de acesso rejeitado',
      mensagem: status === 'aprovado'
        ? `O teu pedido de acesso a "${pedido.titulo}" foi aprovado.`
        : `O teu pedido de acesso a "${pedido.titulo}" não foi aceite.`,
      link: '/explorar',
    })

    res.status(200).json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao responder pedido:', error)
    res.status(500).json({ erro: 'Erro interno ao responder pedido.' })
  }
}

export async function solicitarAcessoConteudo(req: Request, res: Response): Promise<void> {
  try {
    const conteudoId = parseInt(String(req.params.id))
    const { motivo } = req.body as { motivo?: string }

    if (isNaN(conteudoId)) {
      res.status(400).json({ erro: 'Pedido de acesso inválido.' })
      return
    }

    const pedidoId = await ContentModel.criarSolicitacaoAcesso(conteudoId, req.user!.userId, motivo?.trim() || null)

    // Notifica o criador do conteúdo sobre o novo pedido.
    // entidade_id aqui é o ID do PEDIDO (solicitacao_acesso_jindungo), não do
    // conteúdo — é o que a rota de resposta (/content/access-requests/:pedidoId)
    // precisa para poder aceitar/recusar directamente a partir da notificação.
    const [conteudoRows] = await pool.query<any[]>(
      'SELECT titulo, publicado_por FROM conteudo WHERE id = ? LIMIT 1',
      [conteudoId],
    )
    const conteudo = conteudoRows[0]
    if (conteudo && conteudo.publicado_por !== req.user!.userId) {
      await criarNotificacao({
        usuarioId: conteudo.publicado_por,
        tipo: 'pedido_acesso_jindungo',
        entidadeId: pedidoId,
        titulo: 'Novo pedido de acesso Jindungo',
        mensagem: `Alguém solicitou acesso ao teu conteúdo "${conteudo.titulo}".`,
        link: '/explorar',
      })
    }

    res.status(201).json({
      sucesso: true,
      accessRequest: {
        status: 'pendente',
        requestedAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        notes: null,
      },
    })
  } catch (error) {
    console.error('Erro ao solicitar acesso:', error)
    res.status(500).json({ erro: 'Erro interno ao solicitar acesso.' })
  }
}

export async function registrarVisualizacao(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const conteudoId = parseInt(String(id))
    
    if (isNaN(conteudoId)) {
      res.status(400).json({ erro: 'ID de conteúdo inválido' })
      return
    }

    // affectedRows pode ser 0 por dois motivos bem distintos: o conteúdo não
    // existe, OU o próprio criador está a ver o seu conteúdo (ignorado de
    // propósito). Só devolvemos 404 no primeiro caso.
    await ContentModel.incrementarVisualizacoes(conteudoId, req.user?.userId ?? null)
    const existe = await ContentModel.findConteudoById(conteudoId)
    if (!existe) {
      res.status(404).json({ erro: 'Conteúdo não encontrado' })
      return
    }

    res.status(200).json({ sucesso: true, mensagem: 'Visualização registrada' })
  } catch (error) {
    console.error('Erro ao registrar visualização:', error)
    res.status(500).json({ erro: 'Erro interno ao registrar visualização.' })
  }
}

export async function reagirConteudo(req: Request, res: Response): Promise<void> {
  try {
    const conteudoId = parseInt(String(req.params.id))
    const { tipo } = req.body as { tipo?: 'like' | 'dislike' | null }

    if (isNaN(conteudoId) || !['like', 'dislike', null].includes(tipo ?? null)) {
      res.status(400).json({ erro: 'Pedido de reação inválido.' })
      return
    }

    const contadores = await ContentModel.setConteudoReacao(conteudoId, req.user!.userId, tipo ?? null)
    res.status(200).json({ sucesso: true, tipo: tipo ?? null, ...contadores })
  } catch (error) {
    console.error('Erro ao reagir ao conteúdo:', error)
    res.status(500).json({ erro: 'Erro interno ao reagir ao conteúdo.' })
  }
}

export async function guardarConteudo(req: Request, res: Response): Promise<void> {
  try {
    const conteudoId = parseInt(String(req.params.id))
    const { saved } = req.body as { saved?: boolean }

    if (isNaN(conteudoId) || typeof saved !== 'boolean') {
      res.status(400).json({ erro: 'Pedido de favorito inválido.' })
      return
    }

    await ContentModel.toggleConteudoSalvo(conteudoId, req.user!.userId, saved)
    res.status(200).json({ sucesso: true, saved })
  } catch (error) {
    console.error('Erro ao guardar conteúdo:', error)
    res.status(500).json({ erro: 'Erro interno ao guardar conteúdo.' })
  }
}

function mapComentarios(rows: ContentModel.ComentarioConteudoRow[], currentUserId?: number) {
  const byId = new Map<number, any>()
  const roots: any[] = []

  rows.forEach((row) => {
    const initials = row.autor_nome
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()

    byId.set(row.id, {
      id: String(row.id),
      author: row.autor_nome,
      avatar: initials || 'U',
      avatarUrl: row.autor_avatar || null,
      text: row.comentario,
      time: row.publicado_em,
      likes: row.likes || 0,
      replies: [],
      createdByCurrentUser: currentUserId === row.autor_id,
      likedByCurrentUser: Boolean(row.liked_by_current_user),
    })
  })

  rows.forEach((row) => {
    const comment = byId.get(row.id)
    if (row.comentario_pai_id && byId.has(row.comentario_pai_id)) {
      byId.get(row.comentario_pai_id).replies.push(comment)
    } else {
      roots.push(comment)
    }
  })

  return roots.reverse()
}

export async function listarComentarios(req: Request, res: Response): Promise<void> {
  try {
    const conteudoId = parseInt(String(req.params.id))
    if (isNaN(conteudoId)) {
      res.status(400).json({ erro: 'ID de conteúdo inválido.' })
      return
    }

    const rows = await ContentModel.findComentariosConteudo(conteudoId, req.user?.userId)
    res.status(200).json({ comentarios: mapComentarios(rows, req.user?.userId) })
  } catch (error) {
    console.error('Erro ao listar comentários:', error)
    res.status(500).json({ erro: 'Erro interno ao listar comentários.' })
  }
}

export async function criarComentario(req: Request, res: Response): Promise<void> {
  try {
    const conteudoId = parseInt(String(req.params.id))
    const { comentario, comentarioPaiId } = req.body as { comentario?: string; comentarioPaiId?: string | null }
    const texto = comentario?.trim()

    if (isNaN(conteudoId) || !texto) {
      res.status(400).json({ erro: 'Comentário inválido.' })
      return
    }

    await ContentModel.createComentarioConteudo(
      conteudoId,
      req.user!.userId,
      texto,
      comentarioPaiId ? parseInt(comentarioPaiId) : null
    )
    const rows = await ContentModel.findComentariosConteudo(conteudoId, req.user!.userId)
    res.status(201).json({ comentarios: mapComentarios(rows, req.user!.userId) })
  } catch (error) {
    console.error('Erro ao criar comentário:', error)
    res.status(500).json({ erro: 'Erro interno ao criar comentário.' })
  }
}

export async function atualizarComentario(req: Request, res: Response): Promise<void> {
  try {
    const comentarioId = parseInt(String(req.params.commentId))
    const { comentario } = req.body as { comentario?: string }
    const texto = comentario?.trim()

    if (isNaN(comentarioId) || !texto) {
      res.status(400).json({ erro: 'Comentário inválido.' })
      return
    }

    const sucesso = await ContentModel.updateComentarioConteudo(comentarioId, req.user!.userId, texto)
    if (!sucesso) {
      res.status(404).json({ erro: 'Comentário não encontrado ou sem permissão.' })
      return
    }

    res.status(200).json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao atualizar comentário:', error)
    res.status(500).json({ erro: 'Erro interno ao atualizar comentário.' })
  }
}

export async function removerComentario(req: Request, res: Response): Promise<void> {
  try {
    const comentarioId = parseInt(String(req.params.commentId))
    if (isNaN(comentarioId)) {
      res.status(400).json({ erro: 'ID de comentário inválido.' })
      return
    }

    const sucesso = await ContentModel.deleteComentarioConteudo(
      comentarioId,
      req.user!.userId,
      (req.user!.role === 'admin' || req.user!.role === 'superadmin')
    )
    if (!sucesso) {
      res.status(404).json({ erro: 'Comentário não encontrado ou sem permissão.' })
      return
    }

    res.status(200).json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao remover comentário:', error)
    res.status(500).json({ erro: 'Erro interno ao remover comentário.' })
  }
}

// ── POST /api/content/comments/:commentId/report ──────────────────────────────
// Denuncia um comentário como ofensivo/impróprio. Marca `denunciado = true`
// e notifica todos os administradores, para poderem apagar o comentário ou
// ignorar a denúncia (com pré-visualização do comentário).
export async function denunciarComentario(req: Request, res: Response): Promise<void> {
  try {
    const comentarioId = parseInt(String(req.params.commentId))
    if (isNaN(comentarioId)) {
      res.status(400).json({ erro: 'ID de comentário inválido.' })
      return
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT cc.id, cc.comentario, cc.conteudo_id, u.nome AS autor_nome, c.titulo AS conteudo_titulo
         FROM comentario_conteudo cc
         JOIN utilizador u ON u.id = cc.autor_id
         JOIN conteudo   c ON c.id = cc.conteudo_id
        WHERE cc.id = ?
        LIMIT 1`,
      [comentarioId],
    )
    const comentario = rows[0]
    if (!comentario) {
      res.status(404).json({ erro: 'Comentário não encontrado.' })
      return
    }

    await pool.query('UPDATE comentario_conteudo SET denunciado = TRUE WHERE id = ?', [comentarioId])

    const previaComentario = String(comentario['comentario'] ?? '').slice(0, 120)
    await notificarAdmins({
      tipo: 'comentario_denunciado',
      entidadeId: comentarioId,
      titulo: 'Comentário denunciado',
      mensagem: `${comentario['autor_nome']} em "${comentario['conteudo_titulo']}": "${previaComentario}${previaComentario.length === 120 ? '…' : ''}"`,
      link: '/admin',
    })

    res.status(200).json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao denunciar comentário:', error)
    res.status(500).json({ erro: 'Erro interno ao denunciar comentário.' })
  }
}

export async function gostarComentario(req: Request, res: Response): Promise<void> {
  try {
    const comentarioId = parseInt(String(req.params.commentId))
    const { liked } = req.body as { liked?: boolean }

    if (isNaN(comentarioId) || typeof liked !== 'boolean') {
      res.status(400).json({ erro: 'Pedido de like inválido.' })
      return
    }

    const likes = await ContentModel.toggleComentarioLike(comentarioId, req.user!.userId, liked)
    res.status(200).json({ sucesso: true, liked, likes })
  } catch (error) {
    console.error('Erro ao gostar de comentário:', error)
    res.status(500).json({ erro: 'Erro interno ao gostar de comentário.' })
  }
}

export async function listarPlaylist(req: Request, res: Response): Promise<void> {
  try {
    const rows = await ContentModel.getPlaylistUsuario(req.user!.userId)
    const playlistItems = Object.fromEntries(rows.map((row) => [
      `${row.conteudo_id}_${row.episodio_id}`,
      {
        episodeId: row.episodio_id,
        podcastContentId: String(row.conteudo_id),
        episodeTitle: row.episodio_titulo,
        podcastTitle: row.podcast_titulo,
        duration: row.duracao || '',
        date: row.data_publicacao || '',
        podcastAuthor: row.autor || 'Economia com História',
        podcastThumbnail: row.thumbnail_url || undefined,
        audioUrl: row.audio_url || undefined,
        addedAt: new Date(row.adicionado_em).getTime(),
      },
    ]))
    res.status(200).json({ playlistItems })
  } catch (error) {
    console.error('Erro ao listar playlist:', error)
    res.status(500).json({ erro: 'Erro interno ao listar playlist.' })
  }
}

export async function adicionarPlaylist(req: Request, res: Response): Promise<void> {
  try {
    const {
      podcastContentId,
      episodeId,
      episodeTitle,
      podcastTitle,
      duration,
      date,
      podcastAuthor,
      podcastThumbnail,
      audioUrl,
    } = req.body

    const conteudoId = parseInt(podcastContentId)
    if (isNaN(conteudoId) || !episodeId || !episodeTitle || !podcastTitle) {
      res.status(400).json({ erro: 'Item de playlist inválido.' })
      return
    }

    await ContentModel.addPlaylistItem(req.user!.userId, {
      conteudoId,
      episodioId: String(episodeId),
      episodioTitulo: episodeTitle,
      podcastTitulo: podcastTitle,
      duracao: duration,
      dataPublicacao: date,
      autor: podcastAuthor,
      thumbnailUrl: podcastThumbnail,
      audioUrl,
    })
    res.status(201).json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao adicionar à playlist:', error)
    res.status(500).json({ erro: 'Erro interno ao adicionar à playlist.' })
  }
}

export async function removerPlaylist(req: Request, res: Response): Promise<void> {
  try {
    const conteudoId = parseInt(String(req.params.contentId))
    const episodioId = String(req.params.episodeId)
    if (isNaN(conteudoId) || !episodioId) {
      res.status(400).json({ erro: 'Item de playlist inválido.' })
      return
    }

    await ContentModel.removePlaylistItem(req.user!.userId, conteudoId, episodioId)
    res.status(200).json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao remover da playlist:', error)
    res.status(500).json({ erro: 'Erro interno ao remover da playlist.' })
  }
}

// ── GET /api/content/resolve-image?url=... ────────────────────────────────────
// Recebe um URL colado pelo utilizador (ex: link de um pin do Pinterest) e
// devolve o URL da imagem real. Isto é necessário porque o browser não
// consegue "ver" a imagem de dentro de uma página de partilha (não é um
// ficheiro de imagem directo) e por causa de CORS não dá para ler essa
// página a partir do frontend — tem de ser o servidor a ir buscá-la.
const HOSTS_BLOQUEADOS = /^(localhost|127\.|0\.0\.0\.0|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1)/i

function extrairMetaImagem(html: string): string | null {
  const padroes = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ]
  for (const padrao of padroes) {
    const match = html.match(padrao)
    if (match?.[1]) return match[1]
  }
  return null
}

export async function resolverImagemUrl(req: Request, res: Response): Promise<void> {
  const url = String(req.query.url ?? '').trim()

  if (!/^https?:\/\//i.test(url)) {
    res.status(400).json({ erro: 'URL inválido.' })
    return
  }

  let hostname = ''
  try {
    hostname = new URL(url).hostname
  } catch {
    res.status(400).json({ erro: 'URL inválido.' })
    return
  }
  if (HOSTS_BLOQUEADOS.test(hostname)) {
    res.status(400).json({ erro: 'URL não permitido.' })
    return
  }

  // Já é um ficheiro de imagem directo — nada a resolver.
  if (/\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(url)) {
    res.json({ imageUrl: url })
    return
  }

  try {
    const resposta = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomiaComHistoriaBot/1.0; +https://economiahistoria.ao)',
        Accept: 'text/html,image/*',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    })

    const contentType = resposta.headers.get('content-type') ?? ''
    if (contentType.startsWith('image/')) {
      res.json({ imageUrl: resposta.url })
      return
    }
    if (!contentType.includes('text/html')) {
      res.status(422).json({ erro: 'Esse link não é uma imagem nem uma página com pré-visualização.' })
      return
    }

    const html = await resposta.text()
    const imagemEncontrada = extrairMetaImagem(html)
    if (!imagemEncontrada) {
      res.status(422).json({ erro: 'Não foi possível encontrar uma imagem nesse link.' })
      return
    }
    res.json({ imageUrl: imagemEncontrada })
  } catch (error) {
    console.error('Erro ao resolver imagem de URL externo:', error)
    res.status(422).json({ erro: 'Não foi possível aceder a esse link.' })
  }
}
