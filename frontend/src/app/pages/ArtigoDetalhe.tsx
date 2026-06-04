/**
 * ArtigoDetalhe.tsx
 * Página pública de leitura de um artigo individual
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { apiRequest } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { BlocoVisualizador, type Bloco } from './ArtigoEditor'
import { Clock, Eye, ArrowLeft, Edit2, Share2, Tag, User, Calendar } from 'lucide-react'

interface ArtigoCompleto {
  id: number
  titulo: string
  subtitulo: string | null
  slug: string
  resumo: string | null
  capa_url: string | null
  categoria: string | null
  tags: string[]
  destaque: boolean
  status: string
  autor_id: number
  autor_nome: string
  visualizacoes: number
  tempo_leitura: number
  publicado_em: string | null
  blocos: Bloco[]
}

export default function ArtigoDetalhe() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [artigo, setArtigo] = useState<ArtigoCompleto | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    apiRequest<ArtigoCompleto>(`/artigos/slug/${slug}`)
      .then(data => setArtigo(data))
      .catch(e => setErro(e.message || 'Artigo não encontrado.'))
      .finally(() => setLoading(false))
  }, [slug])

  const podeEditar = user && (user.role === 'admin' || user.id === artigo?.autor_id)

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
    </div>
  )

  if (erro || !artigo) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500">{erro || 'Artigo não encontrado.'}</p>
      <button onClick={() => navigate('/artigos')} className="text-sm text-gray-700 underline">← Voltar aos artigos</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Capa */}
      {artigo.capa_url && (
        <div className="relative h-[50vh] overflow-hidden">
          <img src={artigo.capa_url} alt={artigo.titulo} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Navegação */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/artigos')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={15} /> Artigos
          </button>
          <div className="flex items-center gap-2">
            {podeEditar && (
              <button
                onClick={() => navigate(`/admin/artigos/${artigo.id}/editar`)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <Edit2 size={12} /> Editar
              </button>
            )}
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              <Share2 size={12} /> Partilhar
            </button>
          </div>
        </div>

        {/* Cabeçalho do artigo */}
        <header className="mb-10">
          {artigo.categoria && (
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">{artigo.categoria}</span>
          )}
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-3 leading-tight">{artigo.titulo}</h1>
          {artigo.subtitulo && <p className="text-xl text-gray-500 mb-4">{artigo.subtitulo}</p>}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 border-y border-gray-100 py-4 my-4">
            <span className="flex items-center gap-1.5"><User size={13} />{artigo.autor_nome}</span>
            {artigo.publicado_em && (
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                {new Date(artigo.publicado_em).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
            <span className="flex items-center gap-1.5"><Clock size={13} />{artigo.tempo_leitura} min de leitura</span>
            <span className="flex items-center gap-1.5"><Eye size={13} />{artigo.visualizacoes} visualizações</span>
          </div>

          {artigo.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {artigo.tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  <Tag size={10} />{t}
                </span>
              ))}
            </div>
          )}

          {artigo.resumo && (
            <p className="mt-6 text-base text-gray-600 bg-amber-50 border-l-4 border-amber-400 pl-5 py-3 rounded-r-lg italic">{artigo.resumo}</p>
          )}
        </header>

        {/* Conteúdo */}
        <div className="prose-content">
          {artigo.blocos.map(b => <BlocoVisualizador key={b.id} bloco={b} />)}
        </div>

        {/* Rodapé do artigo */}
        <footer className="mt-16 pt-8 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Escrito por <span className="font-semibold text-gray-900">{artigo.autor_nome}</span>
            </p>
            <button onClick={() => navigate('/artigos')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              ← Ver todos os artigos
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
