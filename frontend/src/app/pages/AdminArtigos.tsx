/**
 * AdminArtigos.tsx
 * Aba de gestão de artigos para o AdminDashboard
 * — Lista, filtra, cria, publica/arquiva e gere autores permitidos
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { apiRequest } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useArtigoPermissao } from '../hooks/useArtigoPermissao'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '../components/ui/dialog'
import {
  PlusCircle, Edit2, Trash2, Eye, Send, Archive, Users,
  Search, CheckCircle2, Clock, Globe, Lock, UserPlus, UserMinus,
  AlertCircle, ToggleLeft, ToggleRight,
} from 'lucide-react'

interface ArtigoAdmin {
  id: number
  titulo: string
  slug: string
  categoria: string | null
  status: 'rascunho' | 'publicado' | 'arquivado'
  autor_nome: string
  autor_id: number
  visualizacoes: number
  tempo_leitura: number
  destaque: boolean
  atualizado_em: string
  publicado_em: string | null
}

interface AutorPermitido {
  id: number
  utilizador_id: number
  nome: string
  email: string
  ativo: boolean
  pode_publicar: boolean
  concedido_em: string
  permitido_por_nome: string
  observacoes: string | null
}

interface Utilizador {
  id: number
  nome: string
  email: string
  tipo: string
}

const STATUS_INFO = {
  publicado:  { label: 'Publicado',  icon: Globe,         color: 'text-green-600 bg-green-50 border-green-200' },
  rascunho:   { label: 'Rascunho',   icon: Lock,          color: 'text-amber-600 bg-amber-50 border-amber-200' },
  arquivado:  { label: 'Arquivado',  icon: Archive,       color: 'text-gray-500 bg-gray-50 border-gray-200'   },
}

export default function AdminArtigos() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { permitido } = useArtigoPermissao()

  const [artigos, setArtigos] = useState<ArtigoAdmin[]>([])
  const [autores, setAutores] = useState<AutorPermitido[]>([])
  const [utilizadores, setUtilizadores] = useState<Utilizador[]>([])
  const [loading, setLoading] = useState(true)
  const [abaActiva, setAbaActiva] = useState<'artigos' | 'autores'>('artigos')
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [showAddAutor, setShowAddAutor] = useState(false)
  const [novoAutorId, setNovoAutorId] = useState('')
  const [novoAutorPodePublicar, setNovoAutorPodePublicar] = useState(false)
  const [novoAutorObs, setNovoAutorObs] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null)

  useEffect(() => {
    carregar()
    if (isAdmin) carregarAutores()
  }, [])

  async function carregar() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroStatus) params.set('status', filtroStatus)
      const data = await apiRequest<ArtigoAdmin[]>(`/artigos/admin/todos?${params}`)
      setArtigos(data)
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }

  async function carregarAutores() {
    try {
      const [aut, users] = await Promise.all([
        apiRequest<AutorPermitido[]>('/artigos/admin/autores-permitidos'),
        apiRequest<{ utilizadores: Utilizador[] }>('/admin/utilizadores?limit=100'),
      ])
      setAutores(aut)
      setUtilizadores(users.utilizadores ?? [])
    } catch { /* silencioso */ }
  }

  function mostrarFeedback(tipo: 'sucesso' | 'erro', msg: string) {
    setFeedback({ tipo, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  async function acaoArtigo(id: number, acao: 'publicar' | 'arquivar' | 'apagar') {
    try {
      if (acao === 'apagar') {
        await apiRequest(`/artigos/${id}`, { method: 'DELETE' })
        setArtigos(a => a.filter(x => x.id !== id))
        mostrarFeedback('sucesso', 'Artigo apagado.')
      } else {
        await apiRequest(`/artigos/${id}/${acao}`, { method: 'PATCH' })
        setArtigos(a => a.map(x => x.id === id
          ? { ...x, status: acao === 'publicar' ? 'publicado' : 'arquivado' }
          : x))
        mostrarFeedback('sucesso', acao === 'publicar' ? 'Artigo publicado!' : 'Artigo arquivado.')
      }
    } catch (e: unknown) {
      mostrarFeedback('erro', e instanceof Error ? e.message : 'Erro.')
    }
  }

  async function adicionarAutor() {
    if (!novoAutorId) return
    setSubmitting(true)
    try {
      await apiRequest('/artigos/admin/autores-permitidos', {
        method: 'POST',
        json: { utilizador_id: Number(novoAutorId), pode_publicar: novoAutorPodePublicar, observacoes: novoAutorObs || null },
      })
      await carregarAutores()
      setShowAddAutor(false)
      setNovoAutorId('')
      setNovoAutorPodePublicar(false)
      setNovoAutorObs('')
      mostrarFeedback('sucesso', 'Permissão concedida com sucesso.')
    } catch (e: unknown) {
      mostrarFeedback('erro', e instanceof Error ? e.message : 'Erro.')
    } finally {
      setSubmitting(false)
    }
  }

  async function revogarAutor(utilizadorId: number) {
    try {
      await apiRequest(`/artigos/admin/autores-permitidos/${utilizadorId}`, { method: 'DELETE' })
      setAutores(a => a.filter(x => x.utilizador_id !== utilizadorId))
      mostrarFeedback('sucesso', 'Permissão revogada.')
    } catch { mostrarFeedback('erro', 'Erro ao revogar.') }
  }

  const artigosFiltrados = artigos.filter(a => {
    const matchBusca = !busca || a.titulo.toLowerCase().includes(busca.toLowerCase()) || a.autor_nome.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = !filtroStatus || a.status === filtroStatus
    return matchBusca && matchStatus
  })

  return (
    <div className="space-y-6">
      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${feedback.tipo === 'sucesso' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {feedback.tipo === 'sucesso' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {feedback.msg}
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Artigos</h2>
          <p className="text-sm text-gray-500">{artigos.length} artigos no total</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => { setAbaActiva('autores'); carregarAutores() }}
              className="flex items-center gap-1.5">
              <Users size={14} /> Gerir Autores
            </Button>
          )}
          {permitido && (
            <Button size="sm" onClick={() => navigate('/admin/artigos/novo')} className="flex items-center gap-1.5">
              <PlusCircle size={14} /> Novo Artigo
            </Button>
          )}
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['artigos', 'autores'] as const).map(aba => (
          <button key={aba} onClick={() => setAbaActiva(aba)}
            className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${abaActiva === aba ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {aba === 'artigos' ? `Artigos (${artigos.length})` : `Autores Permitidos (${autores.filter(a => a.ativo).length})`}
          </button>
        ))}
      </div>

      {/* Aba Artigos */}
      {abaActiva === 'artigos' && (
        <div>
          {/* Filtros */}
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Pesquisar por título ou autor..." className="pl-9 text-sm" />
            </div>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 bg-white focus:outline-none focus:border-gray-400">
              <option value="">Todos os estados</option>
              <option value="publicado">Publicado</option>
              <option value="rascunho">Rascunho</option>
              <option value="arquivado">Arquivado</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : artigosFiltrados.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>Nenhum artigo encontrado.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/admin/artigos/novo')}>
                <PlusCircle size={14} className="mr-2" /> Criar o primeiro artigo
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {artigosFiltrados.map(a => {
                const si = STATUS_INFO[a.status]
                const StatusIcon = si.icon
                return (
                  <div key={a.id} className="group flex items-center gap-4 bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-gray-300 transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-gray-900 text-sm truncate">{a.titulo}</p>
                        {a.destaque && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">⭐ Destaque</span>}
                        <span className={`text-xs border px-2 py-0.5 rounded-full flex items-center gap-1 ${si.color}`}>
                          <StatusIcon size={10} /> {si.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-3">
                        <span>{a.autor_nome}</span>
                        {a.categoria && <span className="text-amber-600">{a.categoria}</span>}
                        <span className="flex items-center gap-1"><Clock size={9} />{a.tempo_leitura} min</span>
                        <span className="flex items-center gap-1"><Eye size={9} />{a.visualizacoes}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => navigate(`/artigos/${a.slug}`)} title="Ver"
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"><Eye size={14} /></button>
                      <button onClick={() => navigate(`/admin/artigos/${a.id}/editar`)} title="Editar"
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"><Edit2 size={14} /></button>
                      {a.status !== 'publicado' && (
                        <button onClick={() => acaoArtigo(a.id, 'publicar')} title="Publicar"
                          className="p-1.5 text-green-500 hover:text-green-700 rounded-lg hover:bg-green-50 transition-colors"><Send size={14} /></button>
                      )}
                      {a.status !== 'arquivado' && (
                        <button onClick={() => acaoArtigo(a.id, 'arquivar')} title="Arquivar"
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"><Archive size={14} /></button>
                      )}
                      <button onClick={() => { if (confirm('Apagar este artigo?')) acaoArtigo(a.id, 'apagar') }} title="Apagar"
                        className="p-1.5 text-red-400 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Aba Autores Permitidos */}
      {abaActiva === 'autores' && isAdmin && (
        <div>
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setShowAddAutor(true)} className="flex items-center gap-1.5">
              <UserPlus size={14} /> Permitir Novo Autor
            </Button>
          </div>

          {autores.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum autor externo com permissão.</p>
              <p className="text-xs mt-1">Apenas o admin pode criar artigos por defeito.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {autores.map(a => (
                <div key={a.id} className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${a.ativo ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-gray-900">{a.nome}</p>
                      {a.pode_publicar
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><ToggleRight size={10} /> Pode publicar</span>
                        : <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1"><ToggleLeft size={10} /> Só rascunho</span>
                      }
                      {!a.ativo && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Revogado</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{a.email} · Autorizado por {a.permitido_por_nome} em {new Date(a.concedido_em).toLocaleDateString('pt-PT')}</p>
                    {a.observacoes && <p className="text-xs text-gray-400 italic mt-0.5">{a.observacoes}</p>}
                  </div>
                  {a.ativo && (
                    <button onClick={() => revogarAutor(a.utilizador_id)}
                      className="flex items-center gap-1.5 text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <UserMinus size={12} /> Revogar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Adicionar Autor */}
      <Dialog open={showAddAutor} onOpenChange={setShowAddAutor}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus size={16} /> Permitir Autor de Artigos</DialogTitle>
            <DialogDescription>
              O utilizador seleccionado poderá criar e gerir artigos. Defina o nível de permissão.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Utilizador</label>
              <select
                value={novoAutorId}
                onChange={e => setNovoAutorId(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 bg-white"
              >
                <option value="">Seleccionar utilizador...</option>
                {utilizadores
                  .filter(u => u.tipo !== 'admin' && !autores.find(a => a.utilizador_id === u.id && a.ativo))
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.email})</option>
                  ))}
              </select>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-700">Pode publicar directamente</p>
                <p className="text-xs text-gray-500">Se desactivado, os artigos ficam em rascunho até um admin publicar</p>
              </div>
              <button
                onClick={() => setNovoAutorPodePublicar(!novoAutorPodePublicar)}
                className={`relative w-11 h-6 rounded-full transition-colors ${novoAutorPodePublicar ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${novoAutorPodePublicar ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Observações (opcional)</label>
              <Input
                value={novoAutorObs}
                onChange={e => setNovoAutorObs(e.target.value)}
                placeholder="Ex: Professor convidado, colaborador externo..."
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAutor(false)}>Cancelar</Button>
            <Button onClick={adicionarAutor} disabled={submitting || !novoAutorId} className="flex items-center gap-2">
              <UserPlus size={14} /> Conceder Permissão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
