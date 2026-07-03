import { pool } from '../config/database.js'
import { ResultSetHeader, RowDataPacket } from 'mysql2'

export interface ConteudoRow {
  id: number
  titulo: string
  descricao: string | null
  conteudo_completo: string | null
  tipo: 'video' | 'texto_normal' | 'texto_jindungo' | 'podcast'
  categoria: string | null
  tema: string | null
  duracao: string | null
  url_recurso: string | null
  recurso_filename: string | null
  imagem_filename: string | null
  video_filename: string | null
  apresentador: string | null
  categoria_podcast: string | null
  cache_offline: number | null
  visualizacoes: number
  likes: number
  dislikes: number
  comentarios: number
  publicado_por: number | null
  publicado_em: Date
  autor_nome?: string | null
  autor_avatar?: string | null
  autor_tipo?: string | null
}

export interface ComentarioConteudoRow {
  id: number
  conteudo_id: number
  autor_id: number
  comentario_pai_id: number | null
  comentario: string
  likes: number
  denunciado: number
  editado: number
  editado_em: Date | null
  publicado_em: Date
  autor_nome: string
  autor_avatar: string | null
  liked_by_current_user?: number
}

export interface PlaylistItemRow {
  id: number
  conteudo_id: number
  episodio_id: string
  episodio_titulo: string
  podcast_titulo: string
  duracao: string | null
  data_publicacao: string | null
  autor: string | null
  thumbnail_url: string | null
  audio_url: string | null
  adicionado_em: Date
}

export async function findAllConteudos(): Promise<ConteudoRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.id, c.titulo, c.descricao, c.conteudo_completo, c.tipo, c.categoria, c.tema, c.duracao,
            c.url_recurso, c.recurso_filename, c.imagem_filename, c.video_filename,
            c.apresentador, c.categoria_podcast, c.cache_offline, c.visualizacoes, c.publicado_por, c.publicado_em,
            u.nome AS autor_nome, u.avatar_url AS autor_avatar, u.tipo AS autor_tipo,
            (SELECT COUNT(*) FROM conteudo_reacao cr WHERE cr.conteudo_id = c.id AND cr.tipo = 'like') AS likes,
            (SELECT COUNT(*) FROM conteudo_reacao cr WHERE cr.conteudo_id = c.id AND cr.tipo = 'dislike') AS dislikes,
            (SELECT COUNT(*) FROM comentario_conteudo cc WHERE cc.conteudo_id = c.id) AS comentarios
     FROM conteudo c
     LEFT JOIN utilizador u ON u.id = c.publicado_por
     ORDER BY c.publicado_em DESC`
  )
  return rows as ConteudoRow[]
}

export async function findConteudoById(id: number): Promise<ConteudoRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.id, c.titulo, c.descricao, c.conteudo_completo, c.tipo, c.categoria, c.tema, c.duracao,
            c.url_recurso, c.recurso_filename, c.imagem_filename, c.video_filename,
            c.apresentador, c.categoria_podcast, c.cache_offline, c.visualizacoes, c.publicado_por, c.publicado_em,
            u.nome AS autor_nome, u.avatar_url AS autor_avatar, u.tipo AS autor_tipo,
            (SELECT COUNT(*) FROM conteudo_reacao cr WHERE cr.conteudo_id = c.id AND cr.tipo = 'like') AS likes,
            (SELECT COUNT(*) FROM conteudo_reacao cr WHERE cr.conteudo_id = c.id AND cr.tipo = 'dislike') AS dislikes,
            (SELECT COUNT(*) FROM comentario_conteudo cc WHERE cc.conteudo_id = c.id) AS comentarios
     FROM conteudo c
     LEFT JOIN utilizador u ON u.id = c.publicado_por
     WHERE c.id = ?
     LIMIT 1`,
    [id]
  )
  return (rows as ConteudoRow[])[0] ?? null
}

// Não conta visualizações do próprio criador do conteúdo — só de outros
// utilizadores (autenticados ou anónimos).
export async function incrementarVisualizacoes(id: number, viewerUserId?: number | null): Promise<boolean> {
  const condicaoAutor = viewerUserId ? 'AND (publicado_por IS NULL OR publicado_por != ?)' : ''
  const params = viewerUserId ? [id, viewerUserId] : [id]
  const [result] = await pool.query(
    `UPDATE conteudo SET visualizacoes = visualizacoes + 1 WHERE id = ? ${condicaoAutor}`,
    params
  )
  return (result as any).affectedRows > 0
}

export interface NovoConteudo {
  titulo: string
  descricao?: string | null
  conteudo_completo?: string | null
  tipo: string
  categoria?: string | null
  duracao?: string | null
  url_recurso?: string | null
  imagem_filename?: string | null
  apresentador?: string | null
  categoria_podcast?: string | null
  publicado_por: number
}

export async function createConteudo(data: NovoConteudo): Promise<ConteudoRow | null> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO conteudo
       (titulo, descricao, conteudo_completo, tipo, categoria, duracao,
        url_recurso, imagem_filename, apresentador, categoria_podcast, publicado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.titulo,
      data.descricao ?? null,
      data.conteudo_completo ?? null,
      data.tipo,
      data.categoria ?? null,
      data.duracao ?? null,
      data.url_recurso ?? null,
      data.imagem_filename ?? null,
      data.apresentador ?? null,
      data.categoria_podcast ?? null,
      data.publicado_por,
    ]
  )
  return findConteudoById(result.insertId)
}

export async function updateConteudo(
  id: number,
  data: Partial<Omit<NovoConteudo, 'publicado_por'>>
): Promise<ConteudoRow | null> {
  const campos: string[] = []
  const valores: unknown[] = []
  const permitidos: (keyof typeof data)[] = [
    'titulo', 'descricao', 'conteudo_completo', 'tipo', 'categoria',
    'duracao', 'url_recurso', 'imagem_filename', 'apresentador', 'categoria_podcast',
  ]
  for (const k of permitidos) {
    if (data[k] !== undefined) {
      campos.push(`${k} = ?`)
      valores.push(data[k])
    }
  }
  if (campos.length === 0) return findConteudoById(id)
  valores.push(id)
  await pool.query(`UPDATE conteudo SET ${campos.join(', ')} WHERE id = ?`, valores)
  return findConteudoById(id)
}

export async function deleteConteudo(id: number, usuarioId: number, isAdmin: boolean): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM conteudo WHERE id = ? ${isAdmin ? '' : 'AND publicado_por = ?'}`,
    isAdmin ? [id] : [id, usuarioId]
  )
  return result.affectedRows > 0
}

export async function setConteudoReacao(
  conteudoId: number,
  usuarioId: number,
  tipo: 'like' | 'dislike' | null
) {
  if (tipo === null) {
    await pool.query(
      `DELETE FROM conteudo_reacao WHERE conteudo_id = ? AND subscrito_id = ?`,
      [conteudoId, usuarioId]
    )
  } else {
    await pool.query(
      `INSERT INTO conteudo_reacao (conteudo_id, subscrito_id, tipo)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE tipo = VALUES(tipo), atualizado_em = CURRENT_TIMESTAMP`,
      [conteudoId, usuarioId, tipo]
    )
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       COALESCE(SUM(tipo = 'like'), 0) AS likes,
       COALESCE(SUM(tipo = 'dislike'), 0) AS dislikes
     FROM conteudo_reacao
     WHERE conteudo_id = ?`,
    [conteudoId]
  )
  return rows[0] as { likes: number; dislikes: number }
}

export async function toggleConteudoSalvo(conteudoId: number, usuarioId: number, salvar: boolean): Promise<void> {
  if (salvar) {
    await pool.query(
      `INSERT IGNORE INTO conteudo_salvo (conteudo_id, subscrito_id) VALUES (?, ?)`,
      [conteudoId, usuarioId]
    )
  } else {
    await pool.query(
      `DELETE FROM conteudo_salvo WHERE conteudo_id = ? AND subscrito_id = ?`,
      [conteudoId, usuarioId]
    )
  }
}

export async function getEstadoConteudosUsuario(usuarioId: number) {
  const [reacoes] = await pool.query<RowDataPacket[]>(
    `SELECT conteudo_id, tipo FROM conteudo_reacao WHERE subscrito_id = ?`,
    [usuarioId]
  )
  const [salvos] = await pool.query<RowDataPacket[]>(
    `SELECT conteudo_id FROM conteudo_salvo WHERE subscrito_id = ?`,
    [usuarioId]
  )
  const [acessos] = await pool.query<RowDataPacket[]>(
    `SELECT saj.conteudo_id, saj.status, saj.solicitado_em, saj.respondido_em,
            saj.observacoes_resposta, u.nome AS admin_nome
     FROM solicitacao_acesso_jindungo saj
     LEFT JOIN utilizador u ON u.id = saj.admin_responsavel
     WHERE saj.subscrito_id = ?`,
    [usuarioId]
  )
  const [denuncias] = await pool.query<RowDataPacket[]>(
    `SELECT dc.conteudo_id, dc.status, dc.criada_em, dc.resolvido_em,
            dc.observacoes_moderacao, u.nome AS admin_nome
     FROM denuncia_conteudo dc
     LEFT JOIN utilizador u ON u.id = dc.admin_acao
     WHERE dc.denunciado_por = ?`,
    [usuarioId]
  )
  return { reacoes, salvos, acessos, denuncias }
}

export async function criarDenunciaConteudo(
  conteudoId: number,
  usuarioId: number,
  motivo: string,
  descricao?: string | null
): Promise<void> {
  await pool.query(
    `INSERT INTO denuncia_conteudo (conteudo_id, denunciado_por, motivo, descricao_detalhada)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       motivo = VALUES(motivo),
       descricao_detalhada = VALUES(descricao_detalhada),
       status = 'pendente',
       admin_acao = NULL,
       resolvido_em = NULL,
       observacoes_moderacao = NULL`,
    [conteudoId, usuarioId, motivo, descricao || null]
  )
}

export async function criarSolicitacaoAcesso(
  conteudoId: number,
  usuarioId: number,
  motivo?: string | null
): Promise<number> {
  await pool.query(
    `INSERT INTO solicitacao_acesso_jindungo (conteudo_id, subscrito_id, motivo)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       motivo = VALUES(motivo),
       status = IF(status = 'rejeitado', 'pendente', status),
       solicitado_em = CURRENT_TIMESTAMP,
       respondido_em = NULL`,
    [conteudoId, usuarioId, motivo || null]
  )
  // ON DUPLICATE KEY UPDATE não garante um insertId fiável — vai sempre
  // buscar o id real da linha (nova ou já existente).
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM solicitacao_acesso_jindungo WHERE conteudo_id = ? AND subscrito_id = ? LIMIT 1',
    [conteudoId, usuarioId],
  )
  return (rows as RowDataPacket[])[0]?.['id'] as number
}

export async function findComentariosConteudo(conteudoId: number, usuarioId?: number): Promise<ComentarioConteudoRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT cc.id, cc.conteudo_id, cc.autor_id, cc.comentario_pai_id, cc.comentario,
            cc.likes, cc.denunciado, cc.editado, cc.editado_em, cc.publicado_em,
            u.nome AS autor_nome, u.avatar_url AS autor_avatar,
            ${usuarioId ? `EXISTS(
              SELECT 1 FROM comentario_conteudo_like ccl
              WHERE ccl.comentario_id = cc.id AND ccl.subscrito_id = ?
            )` : '0'} AS liked_by_current_user
     FROM comentario_conteudo cc
     JOIN utilizador u ON u.id = cc.autor_id
     WHERE cc.conteudo_id = ?
     ORDER BY cc.publicado_em ASC`,
    usuarioId ? [usuarioId, conteudoId] : [conteudoId]
  )
  return rows as ComentarioConteudoRow[]
}

export async function createComentarioConteudo(
  conteudoId: number,
  usuarioId: number,
  comentario: string,
  comentarioPaiId: number | null
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO comentario_conteudo (conteudo_id, autor_id, comentario_pai_id, comentario)
     VALUES (?, ?, ?, ?)`,
    [conteudoId, usuarioId, comentarioPaiId, comentario]
  )
  return result.insertId
}

export async function updateComentarioConteudo(comentarioId: number, usuarioId: number, comentario: string): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE comentario_conteudo
     SET comentario = ?, editado = TRUE, editado_em = CURRENT_TIMESTAMP
     WHERE id = ? AND autor_id = ?`,
    [comentario, comentarioId, usuarioId]
  )
  return result.affectedRows > 0
}

export async function deleteComentarioConteudo(comentarioId: number, usuarioId: number, isAdmin: boolean): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM comentario_conteudo WHERE id = ? ${isAdmin ? '' : 'AND autor_id = ?'}`,
    isAdmin ? [comentarioId] : [comentarioId, usuarioId]
  )
  return result.affectedRows > 0
}

export async function toggleComentarioLike(comentarioId: number, usuarioId: number, liked: boolean): Promise<number> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    if (liked) {
      await conn.query(
        `INSERT IGNORE INTO comentario_conteudo_like (comentario_id, subscrito_id) VALUES (?, ?)`,
        [comentarioId, usuarioId]
      )
    } else {
      await conn.query(
        `DELETE FROM comentario_conteudo_like WHERE comentario_id = ? AND subscrito_id = ?`,
        [comentarioId, usuarioId]
      )
    }
    await conn.query(
      `UPDATE comentario_conteudo
       SET likes = (SELECT COUNT(*) FROM comentario_conteudo_like WHERE comentario_id = ?)
       WHERE id = ?`,
      [comentarioId, comentarioId]
    )
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT likes FROM comentario_conteudo WHERE id = ?`,
      [comentarioId]
    )
    await conn.commit()
    return Number(rows[0]?.likes || 0)
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

export async function getPlaylistUsuario(usuarioId: number): Promise<PlaylistItemRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, conteudo_id, episodio_id, episodio_titulo, podcast_titulo, duracao,
            data_publicacao, autor, thumbnail_url, audio_url, adicionado_em
     FROM playlist_item
     WHERE subscrito_id = ?
     ORDER BY adicionado_em DESC`,
    [usuarioId]
  )
  return rows as PlaylistItemRow[]
}

export async function addPlaylistItem(usuarioId: number, item: {
  conteudoId: number
  episodioId: string
  episodioTitulo: string
  podcastTitulo: string
  duracao?: string
  dataPublicacao?: string
  autor?: string
  thumbnailUrl?: string
  audioUrl?: string
}): Promise<void> {
  await pool.query(
    `INSERT INTO playlist_item (
       subscrito_id, conteudo_id, episodio_id, episodio_titulo, podcast_titulo,
       duracao, data_publicacao, autor, thumbnail_url, audio_url
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       episodio_titulo = VALUES(episodio_titulo),
       podcast_titulo = VALUES(podcast_titulo),
       duracao = VALUES(duracao),
       data_publicacao = VALUES(data_publicacao),
       autor = VALUES(autor),
       thumbnail_url = VALUES(thumbnail_url),
       audio_url = VALUES(audio_url),
       adicionado_em = CURRENT_TIMESTAMP`,
    [
      usuarioId,
      item.conteudoId,
      item.episodioId,
      item.episodioTitulo,
      item.podcastTitulo,
      item.duracao || null,
      item.dataPublicacao || null,
      item.autor || null,
      item.thumbnailUrl || null,
      item.audioUrl || null,
    ]
  )
}

export async function removePlaylistItem(usuarioId: number, conteudoId: number, episodioId: string): Promise<void> {
  await pool.query(
    `DELETE FROM playlist_item WHERE subscrito_id = ? AND conteudo_id = ? AND episodio_id = ?`,
    [usuarioId, conteudoId, episodioId]
  )
}
