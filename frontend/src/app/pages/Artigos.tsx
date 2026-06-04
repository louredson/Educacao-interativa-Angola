/**
 * Artigos.tsx
 * Página pública de listagem de artigos
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { apiRequest } from '../services/api'
import { Clock, BookOpen, Search, Tag, Star, Eye } from 'lucide-react'

interface ArtigoResumo {
  id: number
  titulo: string
  subtitulo: string | null
  slug: string
  resumo: string | null
  capa_url: string | null
  categoria: string | null
  tags: string[]
  destaque: boolean
  autor_nome: string
  visualizacoes: number
  tempo_leitura: number
  publicado_em: string
}

const CATEGORIAS = ['Todas', 'Economia', 'História', 'Política', 'Cultura', 'Sociedade', 'Tecnologia', 'Educação', 'Análise', 'Opinião']

export default function Artigos() {
  const navigate = useNavigate()
  const [artigos, setArtigos] = useState<ArtigoResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (busca)    params.set('q', busca)
    if (categoria && categoria !== 'Todas') params.set('categoria', categoria)
    params.set('limit', '18')

    apiRequest<{ artigos: ArtigoResumo[]; total: number }>(`/artigos?${params}`)
      .then(r => { setArtigos(r.artigos); setTotal(r.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [busca, categoria])

  const destaques = artigos.filter(a => a.destaque).slice(0, 2)
  const restantes = artigos.filter(a => !a.destaque || destaques.length < 2)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Cabeçalho */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Artigos</h1>
          <p className="text-gray-500">Leituras aprofundadas sobre economia e história de Angola</p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Pesquisar artigos..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 bg-white"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIAS.map(c => (
              <button
                key={c}
                onClick={() => setCategoria(c === 'Todas' ? '' : c)}
                className={`px-3 py-2 text-xs font-medium rounded-xl transition-colors ${(c === 'Todas' && !categoria) || categoria === c ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Destaques */}
        {destaques.length > 0 && !busca && !categoria && (
          <div className="grid md:grid-cols-2 gap-5 mb-10">
            {destaques.map(a => (
              <button key={a.id} onClick={() => navigate(`/artigos/${a.slug}`)}
                className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all text-left h-72">
                {a.capa_url && <img src={a.capa_url} alt={a.titulo} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    {a.categoria && <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">{a.categoria}</span>}
                  </div>
                  <h2 className="text-xl font-bold leading-snug mb-1">{a.titulo}</h2>
                  {a.subtitulo && <p className="text-sm text-white/70 line-clamp-2">{a.subtitulo}</p>}
                  <div className="flex items-center gap-3 mt-3 text-xs text-white/60">
                    <span className="flex items-center gap-1"><Clock size={10} />{a.tempo_leitura} min</span>
                    <span className="flex items-center gap-1"><Eye size={10} />{a.visualizacoes}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Grid de artigos */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : artigos.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum artigo encontrado.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">{total} artigos encontrados</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {restantes.map(a => (
                <button key={a.id} onClick={() => navigate(`/artigos/${a.slug}`)}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left overflow-hidden">
                  {a.capa_url
                    ? <div className="h-44 overflow-hidden"><img src={a.capa_url} alt={a.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                    : <div className="h-44 bg-gradient-to-br from-amber-50 to-gray-100 flex items-center justify-center"><BookOpen size={32} className="text-gray-300" /></div>
                  }
                  <div className="p-4">
                    {a.categoria && <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">{a.categoria}</span>}
                    <h3 className="font-bold text-gray-900 mt-1 mb-1 line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors">{a.titulo}</h3>
                    {a.resumo && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{a.resumo}</p>}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{a.autor_nome}</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-0.5"><Clock size={10} />{a.tempo_leitura} min</span>
                        <span className="flex items-center gap-0.5"><Eye size={10} />{a.visualizacoes}</span>
                      </div>
                    </div>
                    {a.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {a.tags.slice(0, 3).map(t => (
                          <span key={t} className="flex items-center gap-0.5 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                            <Tag size={8} />{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
