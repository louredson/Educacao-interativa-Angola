import { apiRequest, resolveUploadUrl } from './api'

// Conteúdos da biblioteca (ecrã Explorar). Equivalente ao "courseService"
// pedido na especificação — chamado contentService para refletir o domínio
// real do backend (`/api/content`).

export interface ConteudoRaw {
  id: number
  titulo: string
  descricao: string | null
  conteudo_completo: string | null
  tipo: 'video' | 'texto_normal' | 'texto_jindungo' | 'podcast'
  categoria: string | null
  tema?: string | null
  duracao?: string | null
  url_recurso?: string | null
  imagem_filename?: string | null
  video_filename?: string | null
  apresentador?: string | null
  categoria_podcast?: string | null
  publicado_por?: number | null
  publicado_em?: string | null
  autor_nome?: string | null
  autor_avatar?: string | null
  autor_tipo?: string | null
  likes: number
  dislikes?: number
  comentarios: number
  visualizacoes: number
}

export interface PodcastEpisodeRaw {
  id: string
  title: string
  duration?: string
  description?: string
  date?: string
  audioUrl?: string
  audioFileName?: string
}

export interface AccessInfo {
  status: 'pendente' | 'aprovado' | 'rejeitado'
  requestedAt: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  notes: string | null
}

export interface EstadoConteudosUsuario {
  likedContents: Record<string, boolean>
  savedContents: Record<string, boolean>
  accessRequested?: Record<string, AccessInfo>
  reportedContents?: Record<string, ReportInfo>
}

export function listContent() {
  return apiRequest<{ conteudos: ConteudoRaw[] }>('/content', { anonymous: true })
}

/** Estado do utilizador (gostos/guardados/pedidos de acesso) — requer sessão; falha silenciosamente para anónimos. */
export function getUserContentState() {
  return apiRequest<EstadoConteudosUsuario>('/content/me/state')
}

export function reactToContent(id: number, tipo: 'like' | 'dislike' | null) {
  return apiRequest(`/content/${id}/reaction`, { method: 'POST', json: { tipo } })
}

export function saveContent(id: number, saved: boolean) {
  return apiRequest(`/content/${id}/save`, { method: 'POST', json: { saved } })
}

/** Regista uma visualização (usado quando o utilizador abre um conteúdo). */
export function registerContentView(id: number) {
  return apiRequest(`/content/${id}/view`, { method: 'POST', anonymous: true })
}

/**
 * Solicita acesso a um "Texto com Jindungo". A aprovação é feita por quem
 * criou o conteúdo (ou um admin), através da rota /content/access-requests/:id
 * — essa gestão não está no mobile (fica na web, no painel de administração).
 */
export function requestContentAccess(id: number, motivo: string) {
  return apiRequest<{ sucesso: boolean; accessRequest: AccessInfo }>(`/content/${id}/access-request`, {
    method: 'POST',
    json: { motivo },
  })
}

/**
 * Resposta do criador do conteúdo a um pedido de acesso Jindungo — usado
 * directamente a partir de uma notificação (aceitar/recusar sem sair da
 * lista de notificações). `pedidoId` é o ID da solicitação (não do conteúdo).
 */
export function responderPedidoAcesso(pedidoId: number, status: 'aprovado' | 'rejeitado') {
  return apiRequest<{ sucesso: boolean }>(`/content/access-requests/${pedidoId}`, {
    method: 'PATCH',
    json: { status },
  })
}

export interface PedidoAcessoRaw {
  id: number
  status: 'pendente' | 'aprovado' | 'rejeitado'
  motivo: string | null
  solicitado_em: string
  respondido_em: string | null
  usuario_id: number
  usuario_nome: string
  usuario_email: string
  conteudo_id: number
  conteudo_titulo: string
}

/** Todos os pedidos de acesso Jindungo feitos aos conteúdos do professor/admin autenticado. */
export function listMyAccessRequests() {
  return apiRequest<{ pedidos: PedidoAcessoRaw[] }>('/content/me/access-requests')
}

/**
 * Resolve um caminho de media guardado no backend para um URL absoluto que o
 * telemóvel consegue carregar. O backend guarda de duas formas diferentes
 * (herdadas da versão web): nomes de ficheiro "nus" em imagem_filename /
 * video_filename (precisam do prefixo /uploads/), e caminhos já completos
 * tipo /uploads/... nos áudios de episódios de podcast. URLs externos
 * (http/https, ex: YouTube) passam inalterados.
 */
export function resolveContentMedia(raw?: string | null): string | undefined {
  if (!raw) return undefined
  if (/^https?:\/\//i.test(raw)) return raw
  const caminho = raw.startsWith('/uploads/') ? raw : `/uploads/${raw}`
  return resolveUploadUrl(caminho)
}

export function parseEpisodios(conteudoCompleto: string | null): PodcastEpisodeRaw[] {
  if (!conteudoCompleto) return []
  try {
    const parsed = JSON.parse(conteudoCompleto)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function isYouTubeUrl(url?: string | null): boolean {
  return !!url && /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url)
}

// ── Comentários ────────────────────────────────────────────────────────────

export interface ComentarioRaw {
  id: string
  author: string
  avatar: string
  avatarUrl?: string | null
  text: string
  time: string
  likes: number
  replies?: ComentarioRaw[]
  createdByCurrentUser?: boolean
  likedByCurrentUser?: boolean
}

/** Lista de comentários (com respostas aninhadas). Pública — não exige sessão. */
export function listComments(contentId: number) {
  return apiRequest<{ comentarios: ComentarioRaw[] }>(`/content/${contentId}/comments`, { anonymous: true })
}

/** Cria um comentário (ou resposta, se comentarioPaiId for indicado). Devolve a lista atualizada. */
export function createComment(contentId: number, texto: string, comentarioPaiId: number | null = null) {
  return apiRequest<{ comentarios: ComentarioRaw[] }>(`/content/${contentId}/comments`, {
    method: 'POST',
    json: { comentario: texto, comentarioPaiId },
  })
}

export function updateComment(commentId: number, texto: string) {
  return apiRequest<{ sucesso: boolean }>(`/content/comments/${commentId}`, {
    method: 'PATCH',
    json: { comentario: texto },
  })
}

export function deleteComment(commentId: number) {
  return apiRequest<{ sucesso: boolean }>(`/content/comments/${commentId}`, { method: 'DELETE' })
}

export function likeComment(commentId: number, liked: boolean) {
  return apiRequest<{ sucesso: boolean; liked: boolean; likes: number }>(`/content/comments/${commentId}/like`, {
    method: 'POST',
    json: { liked },
  })
}

/** Denuncia um comentário como ofensivo/impróprio. Notifica os administradores. */
export function reportComment(commentId: number) {
  return apiRequest<{ sucesso: boolean }>(`/content/comments/${commentId}/report`, { method: 'POST' })
}

// ── Denúncias ──────────────────────────────────────────────────────────────

export interface ReportInfo {
  status: 'pendente' | 'resolvido' | 'rejeitado'
  reportedAt: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  notes: string | null
}

export const MOTIVOS_DENUNCIA = [
  { value: 'spam', label: 'Conteúdo de spam ou publicidade' },
  { value: 'ofensivo', label: 'Conteúdo ofensivo ou inadequado' },
  { value: 'desinformacao', label: 'Desinformação ou fake news' },
  { value: 'direitos', label: 'Violação de direitos autorais' },
  { value: 'outro', label: 'Outro motivo' },
] as const

export function reportContent(id: number, motivo: string, descricao?: string) {
  return apiRequest<{ sucesso: boolean; report: ReportInfo }>(`/content/${id}/report`, {
    method: 'POST',
    json: { motivo, descricao: descricao?.trim() || undefined },
  })
}

// ── Playlist de episódios (ouvir mais tarde) ─────────────────────────────────

export interface PlaylistItem {
  episodeId: string
  podcastContentId: string
  episodeTitle: string
  podcastTitle: string
  duration?: string
  date?: string
  podcastAuthor?: string
  podcastThumbnail?: string
  audioUrl?: string
  addedAt: number
}

export function getPlaylist() {
  return apiRequest<{ playlistItems: Record<string, PlaylistItem> }>('/content/me/playlist')
}

export function addToPlaylist(item: Omit<PlaylistItem, 'addedAt'>) {
  return apiRequest<{ sucesso: boolean }>('/content/me/playlist', { method: 'POST', json: item })
}

export function removeFromPlaylist(contentId: number, episodeId: string) {
  return apiRequest<{ sucesso: boolean }>(`/content/me/playlist/${contentId}/${episodeId}`, { method: 'DELETE' })
}
