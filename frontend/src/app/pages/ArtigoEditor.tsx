/**
 * ArtigoEditor.tsx
 * Editor completo de artigos com:
 *  - Blocos de conteúdo (texto, imagem, vídeo, citação, lista, separador, etc.)
 *  - Assistência de IA (geração, melhoria e continuação de texto)
 *  - Introdução de texto externo (colar e converter em blocos)
 *  - Controlo de permissões (admin ou autores autorizados)
 *  - Publicação / Rascunho / Arquivar
 */
import {
  useState, useRef, useCallback, useEffect, type DragEvent, type KeyboardEvent
} from 'react'
import { useNavigate, useParams } from 'react-router'
import { apiRequest } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Button }   from '../components/ui/button'
import { Input }    from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge }    from '../components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '../components/ui/dialog'
import {
  Type, Image, Video, Quote, List, Minus, Code2, Heading2, Heading3,
  Wand2, PlusCircle, Trash2, GripVertical, Eye, Save, Send, X,
  ChevronUp, ChevronDown, AlignLeft, AlignCenter, AlignRight,
  Maximize2, Clipboard, Sparkles, Loader2, ArrowLeft, Settings,
  CheckCircle2, Clock, Globe, Lock, AlertCircle, LayoutTemplate,
} from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type TipoBloco =
  | 'paragrafo'
  | 'titulo_secao'
  | 'subtitulo_secao'
  | 'imagem'
  | 'video_url'
  | 'citacao'
  | 'destaque'
  | 'separador'
  | 'lista'
  | 'codigo'

export interface Bloco {
  id: string
  tipo: TipoBloco
  conteudo?: string
  url?: string
  filename?: string
  legenda?: string
  alt_text?: string
  alinhamento?: 'esquerda' | 'centro' | 'direita' | 'largura_total'
  largura?: 'normal' | 'medio' | 'amplo' | 'total'
  meta?: Record<string, unknown>
}

interface Artigo {
  id?: number
  titulo: string
  subtitulo: string
  resumo: string
  capa_url: string
  categoria: string
  tags: string[]
  status: 'rascunho' | 'publicado' | 'arquivado'
  destaque: boolean
  blocos: Bloco[]
  tempo_leitura?: number
  visualizacoes?: number
  autor_nome?: string
  publicado_em?: string
}

// ── Configuração dos tipos de bloco ──────────────────────────────────────────
const TIPOS_BLOCO = [
  { tipo: 'paragrafo'       as TipoBloco, label: 'Parágrafo',      icon: Type,     desc: 'Texto normal' },
  { tipo: 'titulo_secao'    as TipoBloco, label: 'Título',         icon: Heading2, desc: 'Título de secção' },
  { tipo: 'subtitulo_secao' as TipoBloco, label: 'Subtítulo',      icon: Heading3, desc: 'Subtítulo de secção' },
  { tipo: 'imagem'          as TipoBloco, label: 'Imagem',         icon: Image,    desc: 'Imagem com legenda' },
  { tipo: 'video_url'       as TipoBloco, label: 'Vídeo',          icon: Video,    desc: 'YouTube, Vimeo ou URL' },
  { tipo: 'citacao'         as TipoBloco, label: 'Citação',        icon: Quote,    desc: 'Bloco de citação destacado' },
  { tipo: 'destaque'        as TipoBloco, label: 'Destaque',       icon: Sparkles, desc: 'Caixa de informação importante' },
  { tipo: 'lista'           as TipoBloco, label: 'Lista',          icon: List,     desc: 'Lista de pontos ou numerada' },
  { tipo: 'separador'       as TipoBloco, label: 'Separador',      icon: Minus,    desc: 'Linha divisória' },
  { tipo: 'codigo'          as TipoBloco, label: 'Código',         icon: Code2,    desc: 'Bloco de código' },
] as const

const CATEGORIAS = [
  'Economia', 'História', 'Política', 'Cultura', 'Sociedade',
  'Tecnologia', 'Educação', 'Análise', 'Opinião',
]

// ── Utilitários ───────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)

function blocoVazio(tipo: TipoBloco): Bloco {
  return { id: uid(), tipo, conteudo: '', alinhamento: 'esquerda', largura: 'normal' }
}

function textoParaBlocos(texto: string): Bloco[] {
  return texto
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => {
      if (/^#{1}\s/.test(p)) return { ...blocoVazio('titulo_secao'),    conteudo: p.replace(/^#+\s/, '') }
      if (/^#{2,3}\s/.test(p)) return { ...blocoVazio('subtitulo_secao'), conteudo: p.replace(/^#+\s/, '') }
      if (/^>\s/.test(p))      return { ...blocoVazio('citacao'),         conteudo: p.replace(/^>\s/, '') }
      if (/^[-*]\s/.test(p))   return { ...blocoVazio('lista'),           conteudo: p }
      return { ...blocoVazio('paragrafo'), conteudo: p }
    })
}

function getYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  return m?.[1] ?? null
}

// ── Componente: Renderizador de Bloco (leitura) ───────────────────────────────
export function BlocoVisualizador({ bloco }: { bloco: Bloco }) {
  const base = 'mb-4'
  switch (bloco.tipo) {
    case 'titulo_secao':
      return <h2 className={`${base} text-2xl font-bold text-gray-900 mt-8 mb-3`}>{bloco.conteudo}</h2>
    case 'subtitulo_secao':
      return <h3 className={`${base} text-xl font-semibold text-gray-800 mt-6 mb-2`}>{bloco.conteudo}</h3>
    case 'paragrafo':
      return <p className={`${base} text-gray-700 leading-relaxed`} dangerouslySetInnerHTML={{ __html: bloco.conteudo ?? '' }} />
    case 'imagem':
      return (
        <figure className={`${base} ${bloco.largura === 'total' ? 'w-full' : bloco.largura === 'amplo' ? 'max-w-3xl mx-auto' : 'max-w-xl mx-auto'}`}>
          <img src={bloco.url || bloco.filename} alt={bloco.alt_text || bloco.legenda || ''} className="w-full rounded-lg shadow-sm" />
          {bloco.legenda && <figcaption className="text-center text-sm text-gray-500 mt-2 italic">{bloco.legenda}</figcaption>}
        </figure>
      )
    case 'video_url': {
      const ytId = bloco.url ? getYoutubeId(bloco.url) : null
      return (
        <div className={`${base} ${bloco.largura === 'total' ? 'w-full' : 'max-w-2xl mx-auto'}`}>
          {ytId
            ? <div className="relative aspect-video rounded-lg overflow-hidden shadow-sm">
                <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${ytId}`} allowFullScreen title={bloco.legenda || 'Vídeo'} />
              </div>
            : <video src={bloco.url} controls className="w-full rounded-lg" />
          }
          {bloco.legenda && <p className="text-center text-sm text-gray-500 mt-2 italic">{bloco.legenda}</p>}
        </div>
      )
    }
    case 'citacao':
      return <blockquote className={`${base} border-l-4 border-amber-500 pl-6 py-2 italic text-gray-700 bg-amber-50 rounded-r-lg`}>{bloco.conteudo}</blockquote>
    case 'destaque':
      return <div className={`${base} bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-900`}>{bloco.conteudo}</div>
    case 'lista':
      return (
        <ul className={`${base} list-disc pl-6 text-gray-700 space-y-1`}>
          {(bloco.conteudo ?? '').split('\n').filter(Boolean).map((item, i) => (
            <li key={i}>{item.replace(/^[-*•]\s?/, '')}</li>
          ))}
        </ul>
      )
    case 'separador':
      return <hr className={`${base} border-gray-200 my-8`} />
    case 'codigo':
      return <pre className={`${base} bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono`}><code>{bloco.conteudo}</code></pre>
    default:
      return null
  }
}

// ── Componente: Editor individual de Bloco ────────────────────────────────────
function BlocoEditor({
  bloco, index, total,
  onChange, onDelete, onMoveUp, onMoveDown, onAIAssist,
  isDragging, onDragStart, onDragOver, onDrop,
}: {
  bloco: Bloco
  index: number
  total: number
  onChange: (b: Bloco) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onAIAssist: (blocoId: string, instrucao: string) => void
  isDragging: boolean
  onDragStart: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDrop: (e: DragEvent) => void
}) {
  const [showAI, setShowAI] = useState(false)
  const [aiInstrucao, setAiInstrucao] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [bloco.conteudo])

  async function handleAIAssist() {
    if (!aiInstrucao.trim()) return
    setLoadingAI(true)
    await onAIAssist(bloco.id, aiInstrucao)
    setLoadingAI(false)
    setShowAI(false)
    setAiInstrucao('')
  }

  const inputClass = "w-full bg-transparent border-0 border-b border-dashed border-gray-200 focus:border-gray-400 focus:ring-0 outline-none resize-none py-1 text-sm leading-relaxed transition-colors placeholder:text-gray-300"

  return (
    <div
      className={`group relative flex gap-3 rounded-xl p-3 transition-all ${isDragging ? 'opacity-50 scale-95' : 'hover:bg-gray-50'}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Handle de drag */}
      <div className="flex flex-col items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical size={14} className="text-gray-400" />
      </div>

      {/* Conteúdo do bloco */}
      <div className="flex-1 min-w-0">
        {/* Badge do tipo */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            {TIPOS_BLOCO.find(t => t.tipo === bloco.tipo)?.label}
          </span>
          {bloco.tipo !== 'separador' && (
            <button
              onClick={() => setShowAI(!showAI)}
              className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Wand2 size={11} /> IA
            </button>
          )}
        </div>

        {/* Campos por tipo */}
        {bloco.tipo === 'separador' && (
          <div className="flex items-center gap-2 py-2">
            <hr className="flex-1 border-gray-200" />
            <span className="text-xs text-gray-400">§</span>
            <hr className="flex-1 border-gray-200" />
          </div>
        )}

        {['paragrafo', 'lista', 'codigo'].includes(bloco.tipo) && (
          <textarea
            ref={textareaRef}
            value={bloco.conteudo ?? ''}
            onChange={e => onChange({ ...bloco, conteudo: e.target.value })}
            placeholder={
              bloco.tipo === 'lista' ? '- Item 1\n- Item 2\n- Item 3'
              : bloco.tipo === 'codigo' ? 'Cole o seu código aqui...'
              : 'Escreva aqui...'
            }
            className={`${inputClass} ${bloco.tipo === 'codigo' ? 'font-mono text-xs bg-gray-900 text-green-400 rounded p-3' : ''}`}
            rows={bloco.tipo === 'lista' ? 4 : bloco.tipo === 'codigo' ? 6 : 3}
          />
        )}

        {['titulo_secao', 'subtitulo_secao'].includes(bloco.tipo) && (
          <input
            value={bloco.conteudo ?? ''}
            onChange={e => onChange({ ...bloco, conteudo: e.target.value })}
            placeholder={bloco.tipo === 'titulo_secao' ? 'Título da secção...' : 'Subtítulo da secção...'}
            className={`w-full bg-transparent border-0 border-b border-dashed border-gray-200 focus:border-gray-400 outline-none py-1 transition-colors placeholder:text-gray-300 ${bloco.tipo === 'titulo_secao' ? 'text-xl font-bold' : 'text-lg font-semibold'}`}
          />
        )}

        {['citacao', 'destaque'].includes(bloco.tipo) && (
          <textarea
            value={bloco.conteudo ?? ''}
            onChange={e => onChange({ ...bloco, conteudo: e.target.value })}
            placeholder={bloco.tipo === 'citacao' ? '"Uma citação inspiradora..."' : '💡 Informação importante a destacar...'}
            className={inputClass}
            rows={3}
          />
        )}

        {bloco.tipo === 'imagem' && (
          <div className="space-y-2">
            <input
              value={bloco.url ?? ''}
              onChange={e => onChange({ ...bloco, url: e.target.value })}
              placeholder="URL da imagem (https://...)"
              className={`${inputClass} font-mono text-xs`}
            />
            <input
              value={bloco.legenda ?? ''}
              onChange={e => onChange({ ...bloco, legenda: e.target.value })}
              placeholder="Legenda (opcional)"
              className={inputClass}
            />
            <input
              value={bloco.alt_text ?? ''}
              onChange={e => onChange({ ...bloco, alt_text: e.target.value })}
              placeholder="Texto alternativo (acessibilidade)"
              className={inputClass}
            />
            {bloco.url && (
              <img src={bloco.url} alt={bloco.alt_text || ''} className="max-h-40 rounded object-cover mt-1" onError={e => (e.currentTarget.style.display = 'none')} />
            )}
          </div>
        )}

        {bloco.tipo === 'video_url' && (
          <div className="space-y-2">
            <input
              value={bloco.url ?? ''}
              onChange={e => onChange({ ...bloco, url: e.target.value })}
              placeholder="URL do vídeo (YouTube, Vimeo, MP4...)"
              className={`${inputClass} font-mono text-xs`}
            />
            <input
              value={bloco.legenda ?? ''}
              onChange={e => onChange({ ...bloco, legenda: e.target.value })}
              placeholder="Legenda do vídeo (opcional)"
              className={inputClass}
            />
            {bloco.url && getYoutubeId(bloco.url) && (
              <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 size={12} /> YouTube detectado
              </div>
            )}
          </div>
        )}

        {/* Opções de alinhamento / largura para imagem e vídeo */}
        {['imagem', 'video_url'].includes(bloco.tipo) && (
          <div className="flex gap-3 mt-2">
            <div className="flex gap-1">
              {(['esquerda', 'centro', 'direita', 'largura_total'] as const).map(a => (
                <button key={a}
                  onClick={() => onChange({ ...bloco, alinhamento: a })}
                  className={`p-1 rounded text-xs border transition-colors ${bloco.alinhamento === a ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-400 hover:border-gray-400'}`}
                  title={a}
                >
                  {a === 'esquerda' ? <AlignLeft size={11} />
                    : a === 'centro' ? <AlignCenter size={11} />
                    : a === 'direita' ? <AlignRight size={11} />
                    : <Maximize2 size={11} />}
                </button>
              ))}
            </div>
            <select
              value={bloco.largura ?? 'normal'}
              onChange={e => onChange({ ...bloco, largura: e.target.value as Bloco['largura'] })}
              className="text-xs border border-gray-200 rounded px-1 py-0.5 text-gray-600 bg-white"
            >
              <option value="normal">Normal</option>
              <option value="medio">Médio</option>
              <option value="amplo">Amplo</option>
              <option value="total">Largura Total</option>
            </select>
          </div>
        )}

        {/* Painel de assistência IA inline */}
        {showAI && (
          <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-xs font-medium text-purple-700 mb-2 flex items-center gap-1">
              <Sparkles size={12} /> Assistência de IA
            </p>
            <div className="flex gap-2">
              <input
                value={aiInstrucao}
                onChange={e => setAiInstrucao(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleAIAssist() }}
                placeholder='Ex: "Expande este parágrafo", "Melhora o estilo", "Adiciona exemplos"'
                className="flex-1 text-xs border border-purple-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:border-purple-400"
              />
              <button
                onClick={handleAIAssist}
                disabled={loadingAI || !aiInstrucao.trim()}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {loadingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Aplicar
              </button>
              <button onClick={() => setShowAI(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {['Expande este texto', 'Melhora o estilo', 'Resume em 2 frases', 'Adiciona um exemplo', 'Traduz para Português formal'].map(s => (
                <button key={s} onClick={() => setAiInstrucao(s)}
                  className="text-xs bg-white border border-purple-200 text-purple-600 px-2 py-0.5 rounded-full hover:bg-purple-100 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controlos do bloco */}
      <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onMoveUp}  disabled={index === 0}       className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"><ChevronUp   size={13} /></button>
        <button onClick={onMoveDown} disabled={index === total - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"><ChevronDown size={13} /></button>
        <button onClick={onDelete}  className="p-1 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}

// ── Componente principal: ArtigoEditor ────────────────────────────────────────
export default function ArtigoEditor() {
  const { id: artigoId } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [artigo, setArtigo] = useState<Artigo>({
    titulo: '', subtitulo: '', resumo: '', capa_url: '',
    categoria: '', tags: [], status: 'rascunho', destaque: false, blocos: [],
  })

  const [modoVisualizacao, setModoVisualizacao] = useState(false)
  const [showAddBloco, setShowAddBloco] = useState<number | null>(null) // index de inserção
  const [showImportarTexto, setShowImportarTexto] = useState(false)
  const [textoExterno, setTextoExterno] = useState('')
  const [showAIGlobal, setShowAIGlobal] = useState(false)
  const [aiGlobalPrompt, setAiGlobalPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [loadingAI, setLoadingAI] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [podePublicar, setPodePublicar] = useState(false)

  // Carregar artigo existente
  useEffect(() => {
    if (!artigoId) return
    apiRequest<Artigo & { blocos: Bloco[] }>(`/artigos/id/${artigoId}`)
      .then(data => setArtigo({ ...data, blocos: data.blocos ?? [] }))
      .catch(() => mostrarFeedback('erro', 'Erro ao carregar artigo.'))
  }, [artigoId])

  // Verificar permissão de publicação
  useEffect(() => {
    if (!user) return
    if (user.role === 'admin') { setPodePublicar(true); return }
    apiRequest<{ pode_publicar: boolean }>('/artigos/minha-permissao')
      .then(r => setPodePublicar(r.pode_publicar))
      .catch(() => setPodePublicar(false))
  }, [user])

  function mostrarFeedback(tipo: 'sucesso' | 'erro', mensagem: string) {
    setFeedback({ tipo, mensagem })
    setTimeout(() => setFeedback(null), 4000)
  }

  // ── Manipulação de blocos ─────────────────────────────────────────────────
  function addBloco(tipo: TipoBloco, index: number) {
    const novo = blocoVazio(tipo)
    setArtigo(a => {
      const blocos = [...a.blocos]
      blocos.splice(index + 1, 0, novo)
      return { ...a, blocos }
    })
    setShowAddBloco(null)
  }

  function updateBloco(id: string, updated: Bloco) {
    setArtigo(a => ({ ...a, blocos: a.blocos.map(b => b.id === id ? updated : b) }))
  }

  function deleteBloco(id: string) {
    setArtigo(a => ({ ...a, blocos: a.blocos.filter(b => b.id !== id) }))
  }

  function moveBloco(from: number, to: number) {
    setArtigo(a => {
      const blocos = [...a.blocos]
      const [item] = blocos.splice(from, 1)
      blocos.splice(to, 0, item)
      return { ...a, blocos }
    })
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  function handleDragStart(e: DragEvent, idx: number) {
    setDraggingIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: DragEvent, idx: number) {
    e.preventDefault()
    setDragOverIdx(idx)
  }

  function handleDrop(e: DragEvent, idx: number) {
    e.preventDefault()
    if (draggingIdx !== null && draggingIdx !== idx) moveBloco(draggingIdx, idx)
    setDraggingIdx(null)
    setDragOverIdx(null)
  }

  // ── Importar texto externo ────────────────────────────────────────────────
  function importarTexto() {
    if (!textoExterno.trim()) return
    const novosBlocos = textoParaBlocos(textoExterno)
    setArtigo(a => ({ ...a, blocos: [...a.blocos, ...novosBlocos] }))
    setTextoExterno('')
    setShowImportarTexto(false)
    mostrarFeedback('sucesso', `${novosBlocos.length} blocos importados com sucesso.`)
  }

  // ── Assistência IA por bloco (via backend Groq) ──────────────────────────
  async function handleAIAssistBloco(blocoId: string, instrucao: string) {
    const bloco = artigo.blocos.find(b => b.id === blocoId)
    if (!bloco) return
    setLoadingAI(true)
    try {
      const resp = await apiRequest<{ texto: string }>('/ia/assist', {
        method: 'POST',
        json: {
          tipo: bloco.tipo,
          conteudo: bloco.conteudo ?? '',
          instrucao,
        },
      })
      if (resp.texto) updateBloco(blocoId, { ...bloco, conteudo: resp.texto })
    } catch (err: unknown) {
      mostrarFeedback('erro', err instanceof Error ? err.message : 'Erro ao contactar a IA.')
    } finally {
      setLoadingAI(false)
    }
  }

  // ── IA Global — gerar artigo completo (via backend Groq) ─────────────────
  async function handleAIGlobal() {
    if (!aiGlobalPrompt.trim()) return
    setLoadingAI(true)
    try {
      const parsed = await apiRequest<{
        titulo?: string
        subtitulo?: string
        resumo?: string
        categoria?: string
        tags?: string[]
        blocos?: { tipo: string; conteudo: string }[]
      }>('/ia/gerar', {
        method: 'POST',
        json: { prompt: aiGlobalPrompt },
      })

      setArtigo(a => ({
        ...a,
        titulo:    parsed.titulo    || a.titulo,
        subtitulo: parsed.subtitulo || a.subtitulo,
        resumo:    parsed.resumo    || a.resumo,
        categoria: parsed.categoria || a.categoria,
        tags:      parsed.tags      ?? a.tags,
        blocos: (parsed.blocos ?? []).map(b => ({
          ...blocoVazio((b.tipo as TipoBloco) ?? 'paragrafo'),
          conteudo: b.conteudo ?? '',
        })),
      }))
      setShowAIGlobal(false)
      mostrarFeedback('sucesso', 'Artigo gerado com IA. Revê e personaliza antes de publicar.')
    } catch (err: unknown) {
      mostrarFeedback('erro', err instanceof Error ? err.message : 'Erro ao gerar artigo com IA.')
    } finally {
      setLoadingAI(false)
      setAiGlobalPrompt('')
    }
  }

  // ── Guardar ───────────────────────────────────────────────────────────────
  async function salvar(statusOverride?: Artigo['status']) {
    if (!artigo.titulo.trim()) { mostrarFeedback('erro', 'O título é obrigatório.'); return }
    setSaving(true)
    try {
      const payload = { ...artigo, status: statusOverride ?? artigo.status }
      if (artigoId) {
        await apiRequest(`/artigos/${artigoId}`, { method: 'PUT', json: payload })
      } else {
        const resp = await apiRequest<{ id: number; slug: string }>('/artigos', { method: 'POST', json: payload })
        navigate(`/admin/artigos/${resp.id}/editar`, { replace: true })
      }
      setArtigo(a => ({ ...a, status: statusOverride ?? a.status }))
      mostrarFeedback('sucesso', statusOverride === 'publicado' ? 'Artigo publicado!' : 'Guardado com sucesso.')
    } catch (err: unknown) {
      mostrarFeedback('erro', err instanceof Error ? err.message : 'Erro ao guardar.')
    } finally {
      setSaving(false)
    }
  }

  async function publicar() {
    setPublishing(true)
    await salvar('publicado')
    setPublishing(false)
  }

  // ── Tags ──────────────────────────────────────────────────────────────────
  function addTag(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const nova = tagInput.trim().replace(/,$/, '')
      if (!artigo.tags.includes(nova)) setArtigo(a => ({ ...a, tags: [...a.tags, nova] }))
      setTagInput('')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const tempoLeitura = Math.max(1, Math.ceil(
    artigo.blocos.filter(b => ['paragrafo','titulo_secao','subtitulo_secao','citacao','destaque','lista'].includes(b.tipo))
      .reduce((acc, b) => acc + (b.conteudo ?? '').split(/\s+/).filter(Boolean).length, 0) / 200
  ))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Barra superior ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mr-2">
            <ArrowLeft size={15} /> Admin
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{artigo.titulo || 'Novo Artigo'}</p>
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <Clock size={10} /> ~{tempoLeitura} min leitura
              {artigo.status === 'publicado' && <><Globe size={10} className="text-green-500" /><span className="text-green-600">Publicado</span></>}
              {artigo.status === 'rascunho'  && <><Lock   size={10} className="text-amber-500" /><span className="text-amber-600">Rascunho</span></>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAIGlobal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <Sparkles size={13} /> Gerar com IA
            </button>
            <button
              onClick={() => setShowImportarTexto(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Clipboard size={13} /> Importar Texto
            </button>
            <button
              onClick={() => setModoVisualizacao(!modoVisualizacao)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${modoVisualizacao ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              <Eye size={13} /> {modoVisualizacao ? 'Editar' : 'Pré-visualizar'}
            </button>
            <button
              onClick={() => salvar()}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Guardar
            </button>
            {podePublicar && artigo.status !== 'publicado' && (
              <button
                onClick={publicar}
                disabled={publishing || !artigo.titulo.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {publishing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Publicar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Feedback ── */}
      {feedback && (
        <div className={`fixed top-16 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${feedback.tipo === 'sucesso' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {feedback.tipo === 'sucesso' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {feedback.mensagem}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

        {/* ── Coluna principal (editor / preview) ── */}
        <div>
          {!modoVisualizacao ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Meta do artigo */}
              <div className="p-6 border-b border-gray-100 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1">Imagem de Capa</label>
                  <input
                    value={artigo.capa_url}
                    onChange={e => setArtigo(a => ({ ...a, capa_url: e.target.value }))}
                    placeholder="https://exemplo.com/imagem-capa.jpg"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 font-mono"
                  />
                  {artigo.capa_url && (
                    <img src={artigo.capa_url} alt="capa" className="mt-2 h-32 w-full object-cover rounded-lg" onError={e => (e.currentTarget.style.display = 'none')} />
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1">Título *</label>
                  <input
                    value={artigo.titulo}
                    onChange={e => setArtigo(a => ({ ...a, titulo: e.target.value }))}
                    placeholder="Título do artigo..."
                    className="w-full text-2xl font-bold border-0 border-b-2 border-gray-100 focus:border-gray-400 focus:ring-0 outline-none py-1 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1">Subtítulo</label>
                  <input
                    value={artigo.subtitulo}
                    onChange={e => setArtigo(a => ({ ...a, subtitulo: e.target.value }))}
                    placeholder="Um subtítulo descritivo..."
                    className="w-full text-base text-gray-600 border-0 border-b border-dashed border-gray-200 focus:border-gray-400 focus:ring-0 outline-none py-1 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1">Resumo / Introdução</label>
                  <textarea
                    value={artigo.resumo}
                    onChange={e => setArtigo(a => ({ ...a, resumo: e.target.value }))}
                    placeholder="Breve descrição do artigo (aparece nos listagens e partilhas)..."
                    className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg p-3 focus:outline-none focus:border-gray-400 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Blocos de conteúdo */}
              <div className="p-6">
                {artigo.blocos.length === 0 && (
                  <div className="text-center py-16 text-gray-400">
                    <LayoutTemplate size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Sem blocos ainda</p>
                    <p className="text-xs mt-1">Adiciona um bloco abaixo ou usa a IA para gerar conteúdo</p>
                  </div>
                )}

                {artigo.blocos.map((bloco, idx) => (
                  <div key={bloco.id}>
                    <BlocoEditor
                      bloco={bloco}
                      index={idx}
                      total={artigo.blocos.length}
                      onChange={updated => updateBloco(bloco.id, updated)}
                      onDelete={() => deleteBloco(bloco.id)}
                      onMoveUp={() => moveBloco(idx, idx - 1)}
                      onMoveDown={() => moveBloco(idx, idx + 1)}
                      onAIAssist={handleAIAssistBloco}
                      isDragging={draggingIdx === idx}
                      onDragStart={e => handleDragStart(e, idx)}
                      onDragOver={e => handleDragOver(e, idx)}
                      onDrop={e => handleDrop(e, idx)}
                    />

                    {/* Botão de adicionar bloco entre blocos */}
                    <div className="relative my-1 group">
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        onClick={() => setShowAddBloco(showAddBloco === idx ? null : idx)}
                        className="relative mx-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-full px-3 py-1 opacity-0 group-hover:opacity-100 transition-all hover:shadow-sm"
                      >
                        <PlusCircle size={11} /> Adicionar bloco
                      </button>

                      {showAddBloco === idx && (
                        <div className="absolute z-10 top-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl border border-gray-200 shadow-xl p-3 w-[420px]">
                          <p className="text-xs font-medium text-gray-500 mb-2 px-1">Escolha o tipo de bloco</p>
                          <div className="grid grid-cols-5 gap-1.5">
                            {TIPOS_BLOCO.map(({ tipo, label, icon: Icon, desc }) => (
                              <button
                                key={tipo}
                                onClick={() => addBloco(tipo, idx)}
                                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group/btn"
                                title={desc}
                              >
                                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover/btn:bg-gray-900 flex items-center justify-center transition-colors">
                                  <Icon size={14} className="text-gray-600 group-hover/btn:text-white transition-colors" />
                                </div>
                                <span className="text-[10px] text-gray-500 text-center leading-tight">{label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Botão de adicionar o primeiro / último bloco */}
                <div className="mt-4 border-2 border-dashed border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-center text-gray-400 mb-3">Adicionar bloco</p>
                  <div className="grid grid-cols-5 gap-2">
                    {TIPOS_BLOCO.map(({ tipo, label, icon: Icon }) => (
                      <button
                        key={tipo}
                        onClick={() => addBloco(tipo, artigo.blocos.length - 1)}
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-gray-100 transition-all group/btn"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover/btn:bg-gray-900 flex items-center justify-center transition-colors">
                          <Icon size={16} className="text-gray-500 group-hover/btn:text-white transition-colors" />
                        </div>
                        <span className="text-[10px] text-gray-500">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── Modo pré-visualização ── */
            <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {artigo.capa_url && (
                <img src={artigo.capa_url} alt="capa" className="w-full h-64 object-cover" />
              )}
              <div className="p-8 max-w-3xl mx-auto">
                {artigo.categoria && (
                  <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">{artigo.categoria}</span>
                )}
                <h1 className="text-4xl font-bold text-gray-900 mt-2 mb-2 leading-tight">{artigo.titulo || 'Título do Artigo'}</h1>
                {artigo.subtitulo && <p className="text-xl text-gray-500 mb-4">{artigo.subtitulo}</p>}
                {artigo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {artigo.tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>)}
                  </div>
                )}
                {artigo.resumo && (
                  <p className="text-base text-gray-600 bg-gray-50 border-l-4 border-gray-300 pl-4 py-2 rounded-r mb-6 italic">{artigo.resumo}</p>
                )}
                <div className="space-y-1">
                  {artigo.blocos.map(b => <BlocoVisualizador key={b.id} bloco={b} />)}
                </div>
              </div>
            </article>
          )}
        </div>

        {/* ── Painel lateral: metadados ── */}
        {!modoVisualizacao && (
          <aside className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Settings size={14} /> Configurações</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Categoria</label>
                  <select
                    value={artigo.categoria}
                    onChange={e => setArtigo(a => ({ ...a, categoria: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 bg-white"
                  >
                    <option value="">Seleccionar...</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Tags</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {artigo.tags.map(t => (
                      <span key={t} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        {t}
                        <button onClick={() => setArtigo(a => ({ ...a, tags: a.tags.filter(x => x !== t) }))} className="text-gray-400 hover:text-red-500"><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder="Escreve e pressiona Enter"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Estado</label>
                  <div className="flex gap-2">
                    {(['rascunho', 'publicado', 'arquivado'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => podePublicar || s !== 'publicado' ? setArtigo(a => ({ ...a, status: s })) : undefined}
                        disabled={s === 'publicado' && !podePublicar}
                        className={`flex-1 py-1.5 text-xs rounded-lg border font-medium capitalize transition-colors disabled:opacity-40 ${artigo.status === s ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {!podePublicar && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={11} /> Só o admin pode publicar
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-500">Artigo em Destaque</label>
                  <button
                    onClick={() => setArtigo(a => ({ ...a, destaque: !a.destaque }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${artigo.destaque ? 'bg-amber-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${artigo.destaque ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Estatísticas do artigo */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumo</h3>
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex justify-between"><span>Blocos</span><span className="font-medium text-gray-900">{artigo.blocos.length}</span></div>
                <div className="flex justify-between"><span>Tempo de leitura</span><span className="font-medium text-gray-900">~{tempoLeitura} min</span></div>
                <div className="flex justify-between"><span>Visualizações</span><span className="font-medium text-gray-900">{artigo.visualizacoes ?? 0}</span></div>
                {artigo.publicado_em && <div className="flex justify-between"><span>Publicado</span><span className="font-medium text-gray-900">{new Date(artigo.publicado_em).toLocaleDateString('pt-PT')}</span></div>}
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* ── Modal: Importar Texto Externo ── */}
      <Dialog open={showImportarTexto} onOpenChange={setShowImportarTexto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Clipboard size={16} /> Importar Texto Externo</DialogTitle>
            <DialogDescription>
              Cola qualquer texto. O editor vai detectar automaticamente parágrafos, títulos (#), citações (&gt;) e listas (-).
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={textoExterno}
            onChange={e => setTextoExterno(e.target.value)}
            placeholder="Cola o texto aqui...

# Título detectado automaticamente
Parágrafo normal com texto.

> Citação detectada automaticamente

- Item de lista
- Outro item"
            className="w-full h-64 text-sm border border-gray-200 rounded-xl p-4 font-mono focus:outline-none focus:border-gray-400 resize-none"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportarTexto(false)}>Cancelar</Button>
            <Button onClick={importarTexto} disabled={!textoExterno.trim()}>
              <Clipboard size={14} className="mr-2" /> Importar como Blocos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Gerar com IA ── */}
      <Dialog open={showAIGlobal} onOpenChange={setShowAIGlobal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles size={16} className="text-purple-600" /> Gerar Artigo com IA</DialogTitle>
            <DialogDescription>
              Descreve o tema e a IA vai gerar um rascunho completo com blocos. Podes editar tudo depois.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={aiGlobalPrompt}
            onChange={e => setAiGlobalPrompt(e.target.value)}
            placeholder='Ex: "Artigo sobre o impacto do petróleo na economia angolana no século XX, com contexto histórico e dados económicos"'
            className="w-full h-32 text-sm border border-gray-200 rounded-xl p-4 focus:outline-none focus:border-purple-400 resize-none"
          />
          <div className="flex flex-wrap gap-2">
            {[
              'História económica de Angola pós-independência',
              'O papel do Banco Nacional de Angola',
              'Comércio colonial angolano no século XIX',
              'Economia de guerra e reconstrução em Angola',
            ].map(s => (
              <button key={s} onClick={() => setAiGlobalPrompt(s)}
                className="text-xs bg-purple-50 border border-purple-200 text-purple-600 px-3 py-1 rounded-full hover:bg-purple-100 transition-colors">
                {s}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIGlobal(false)}>Cancelar</Button>
            <Button
              onClick={handleAIGlobal}
              disabled={loadingAI || !aiGlobalPrompt.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loadingAI ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Sparkles size={14} className="mr-2" />}
              Gerar Artigo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loadingAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex items-center gap-4">
            <Loader2 size={24} className="animate-spin text-purple-600" />
            <div>
              <p className="font-semibold text-gray-900">A IA está a trabalhar...</p>
              <p className="text-sm text-gray-500">Isto pode demorar alguns segundos</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
