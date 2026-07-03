import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiRequest } from '../services/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { MessageSquare, Plus, Send, Users, Lock, ArrowLeft, Settings, UserCheck, UserX, Mail, Copy, Check, Trash2, Paperclip, X as XIcon, CornerUpLeft } from 'lucide-react'
import FicheiroPreview from '../components/FicheiroPreview'
import { getApiBase, getToken, resolveUploadUrl } from '../services/api'

interface Sala {
  id: number
  titulo: string
  descricao: string | null
  criador_id: number
  criador_nome: string
  so_membros_comentam: number
  total_mensagens: number
  total_membros: number
  criado_em: string
}

interface Mensagem {
  id: number
  mensagem: string
  ficheiro_url?: string | null
  ficheiro_nome?: string | null
  criado_em: string
  autor_id: number
  autor_nome: string
  autor_avatar: string | null
  mensagem_pai_id?: number | null
  pai_mensagem?: string | null
  pai_ficheiro_nome?: string | null
  pai_autor_nome?: string | null
}

interface Membro {
  id: number
  nome: string
  email: string
  avatar_url: string | null
  aprovado: number
  pode_comentar: number
  entrou_em: string
}

export default function SalasDiscussao() {
  const { user, token } = useAuth()
  const [salas, setSalas] = useState<Sala[]>([])
  const [salaAtiva, setSalaAtiva] = useState<Sala | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [membros, setMembros] = useState<Membro[]>([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [loading, setLoading] = useState(true)
  const [aEnviar, setAEnviar] = useState(false)
  const [showCriar, setShowCriar] = useState(false)
  const [showMembros, setShowMembros] = useState(false)
  const [novaSala, setNovaSala] = useState({ titulo: '', descricao: '', so_membros_comentam: true })
  const [aCriarSala, setACriarSala] = useState(false)
  const [showConvidar, setShowConvidar] = useState(false)
  const [showUsarCodigo, setShowUsarCodigo] = useState(false)
  const [conviteForm, setConviteForm] = useState({ email_destino: '', max_usos: 1, validade_horas: 24 })
  const [codigoCriado, setCodigoCriado] = useState('')
  const [aCriarConvite, setACriarConvite] = useState(false)
  const [codigoConvite, setCodigoConvite] = useState('')
  const [aUsarCodigo, setAUsarCodigo] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [aApagarSala, setAApagarSala] = useState(false)
  const [ficheiroAnexo, setFicheiroAnexo] = useState<File | null>(null)
  const [replyingTo, setReplyingTo] = useState<Mensagem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mensagensEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isProfessorOuAdmin = user?.role === 'professor' || user?.role === 'admin' || user?.role === 'superadmin'
  const isCriador = salaAtiva ? salaAtiva.criador_id === user?.id : false

  useEffect(() => {
    void carregarSalas()
  }, [])

  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function carregarSalas() {
    setLoading(true)
    try {
      const data = await apiRequest<{ salas: Sala[] }>('/salas')
      setSalas(data.salas)
    } catch {
      // sem acesso ou sem salas
    } finally {
      setLoading(false)
    }
  }

  async function abrirSala(sala: Sala) {
    setSalaAtiva(sala)
    setMensagens([])
    try {
      const data = await apiRequest<{ mensagens: Mensagem[] }>(`/salas/${sala.id}/mensagens`)
      setMensagens(data.mensagens)
    } catch {
      // sem acesso
    }
  }

  async function enviarMensagem() {
    if ((!novaMensagem.trim() && !ficheiroAnexo) || !salaAtiva || aEnviar) return
    setAEnviar(true)
    try {
      let data: { mensagem: Mensagem }
      if (ficheiroAnexo) {
        const fd = new FormData()
        fd.append('mensagem', novaMensagem.trim())
        fd.append('ficheiro', ficheiroAnexo)
        if (replyingTo) fd.append('mensagem_pai_id', String(replyingTo.id))
        const resp = await fetch(`${getApiBase()}/salas/${salaAtiva.id}/mensagens`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` },
          body: fd,
        })
        if (!resp.ok) throw new Error((await resp.json()).message ?? 'Erro ao enviar.')
        data = await resp.json()
      } else {
        data = await apiRequest<{ mensagem: Mensagem }>(`/salas/${salaAtiva.id}/mensagens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mensagem: novaMensagem.trim(), mensagem_pai_id: replyingTo?.id ?? null }),
        })
      }
      setMensagens(prev => [...prev, data.mensagem])
      setNovaMensagem('')
      setFicheiroAnexo(null)
      setReplyingTo(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      alert('Não foi possível enviar a mensagem.')
    } finally {
      setAEnviar(false)
    }
  }

  async function criarSala() {
    if (!novaSala.titulo.trim()) return
    setACriarSala(true)
    try {
      await apiRequest('/salas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaSala),
      })
      setShowCriar(false)
      setNovaSala({ titulo: '', descricao: '', so_membros_comentam: true })
      await carregarSalas()
    } catch {
      alert('Não foi possível criar a sala.')
    } finally {
      setACriarSala(false)
    }
  }

  async function carregarMembros() {
    if (!salaAtiva) return
    try {
      const data = await apiRequest<{ membros: Membro[] }>(`/salas/${salaAtiva.id}/membros`)
      setMembros(data.membros)
      setShowMembros(true)
    } catch {
      alert('Sem permissão para ver membros.')
    }
  }

  async function atualizarMembro(membroId: number, campo: 'aprovado' | 'pode_comentar', valor: boolean) {
    if (!salaAtiva) return
    try {
      await apiRequest(`/salas/${salaAtiva.id}/membros/${membroId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [campo]: valor }),
      })
      setMembros(prev => prev.map(m => m.id === membroId ? { ...m, [campo]: valor ? 1 : 0 } : m))
    } catch {
      alert('Não foi possível atualizar o membro.')
    }
  }

  async function criarConvite() {
    if (!salaAtiva) return
    setACriarConvite(true)
    try {
      const data = await apiRequest<{ codigo: string }>('/convites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'sala',
          entidade_id: salaAtiva.id,
          email_destino: conviteForm.email_destino || undefined,
          max_usos: conviteForm.max_usos,
          validade_horas: conviteForm.validade_horas,
        }),
      })
      setCodigoCriado(data.codigo)
    } catch {
      alert('Não foi possível criar o convite.')
    } finally {
      setACriarConvite(false)
    }
  }

  async function usarCodigo() {
    if (!codigoConvite.trim()) return
    setAUsarCodigo(true)
    try {
      const data = await apiRequest<{ message: string; tipo: string; entidade_id: number }>('/convites/usar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigoConvite.trim() }),
      })
      alert(data.message)
      setShowUsarCodigo(false)
      setCodigoConvite('')
      await carregarSalas()
    } catch (err: any) {
      alert(err?.message ?? 'Código inválido ou expirado.')
    } finally {
      setAUsarCodigo(false)
    }
  }

  async function apagarSala(sala: Sala) {
    if (!confirm(`Tens a certeza que queres apagar a sala "${sala.titulo}"? Esta acção não pode ser desfeita.`)) return
    setAApagarSala(true)
    try {
      await apiRequest(`/salas/${sala.id}`, { method: 'DELETE' })
      await carregarSalas()
    } catch {
      alert('Não foi possível apagar a sala.')
    } finally {
      setAApagarSala(false)
    }
  }

  function scrollParaMensagem(id: number) {
    const el = document.getElementById(`msg-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('bg-yellow-50', 'ring-1', 'ring-yellow-300', 'rounded-xl', 'transition-all')
    setTimeout(() => el.classList.remove('bg-yellow-50', 'ring-1', 'ring-yellow-300'), 1500)
  }

  function copiarCodigo() {
    navigator.clipboard.writeText(codigoCriado)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function formatHora(dt: string) {
    return new Date(dt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  }

  function formatData(dt: string) {
    return new Date(dt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Acesso restrito</h2>
        <p className="text-slate-500">Inicia sessão para aceder às Salas de Discussão.</p>
      </div>
    )
  }

  // ── Vista de sala activa ───────────────────────────────────────────────────
  if (salaAtiva) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto">
        {/* Header da sala */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shadow-sm">
          <button onClick={() => setSalaAtiva(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-slate-900 truncate">{salaAtiva.titulo}</h2>
            <p className="text-xs text-slate-500">{salaAtiva.total_membros} membros · criado por {salaAtiva.criador_nome}</p>
          </div>
          {isCriador && (
            <>
              <button onClick={() => { setCodigoCriado(''); setShowConvidar(true) }} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Convidar membros">
                <Mail className="w-5 h-5 text-slate-600" />
              </button>
              <button onClick={carregarMembros} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Gerir membros">
                <Settings className="w-5 h-5 text-slate-600" />
              </button>
            </>
          )}
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
          {mensagens.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Ainda sem mensagens. Começa a conversa!</p>
            </div>
          )}
          {mensagens.map((msg, i) => {
            const isOwn = msg.autor_id === user?.id
            const showDate = i === 0 || formatData(mensagens[i - 1].criado_em) !== formatData(msg.criado_em)
            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-400 px-2">{formatData(msg.criado_em)}</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                )}
                <div id={`msg-${msg.id}`} className={`group flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#800020] to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-4 overflow-hidden">
                    {msg.autor_avatar ? (
                      <img src={resolveUploadUrl(msg.autor_avatar)} alt={msg.autor_nome} className="w-full h-full object-cover" />
                    ) : (
                      msg.autor_nome.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    {!isOwn && <span className="text-xs text-slate-500 px-1">{msg.autor_nome}</span>}
                    {/* Citação da mensagem pai */}
                    {msg.mensagem_pai_id && (msg.pai_mensagem || msg.pai_ficheiro_nome) && (
                      <button
                        onClick={() => scrollParaMensagem(msg.mensagem_pai_id!)}
                        className={`text-left text-[11px] px-2.5 py-1.5 rounded-xl mb-0.5 border-l-2 w-full cursor-pointer transition-opacity hover:opacity-80 ${isOwn ? 'bg-[#5C0016]/40 border-white/50 text-white/80' : 'bg-slate-100 border-slate-300 text-slate-500'}`}
                      >
                        <span className="font-medium block">{msg.pai_autor_nome}</span>
                        <span className="line-clamp-1 flex items-center gap-1">
                          {msg.pai_ficheiro_nome && !msg.pai_mensagem
                            ? <><Paperclip className="w-3 h-3 inline shrink-0" />{msg.pai_ficheiro_nome}</>
                            : msg.pai_mensagem}
                        </span>
                      </button>
                    )}
                    <div className={`px-3 py-2 rounded-2xl text-sm ${isOwn ? 'bg-[#800020] text-white rounded-tr-sm' : 'bg-white text-slate-800 shadow-sm rounded-tl-sm border border-slate-100'}`}>
                      {msg.mensagem && <span>{msg.mensagem}</span>}
                      {msg.ficheiro_url && (
                        <div className={msg.mensagem ? 'mt-2' : ''}>
                          <FicheiroPreview ficheiroUrl={msg.ficheiro_url} ficheiroNome={msg.ficheiro_nome} />
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center gap-2 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-[10px] text-slate-400">{formatHora(msg.criado_em)}</span>
                      <button
                        onClick={() => { setReplyingTo(msg); inputRef.current?.focus() }}
                        className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 hover:border-[#800020] hover:text-[#800020] hover:bg-[#FFF2F2] transition-colors"
                      >
                        <CornerUpLeft className="w-3 h-3" /> Responder
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={mensagensEndRef} />
        </div>

        {/* Input de mensagem */}
        <div className="px-4 py-3 border-t bg-white">
          {replyingTo && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <CornerUpLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] text-slate-500 flex-1 truncate">
                A responder a <strong>{replyingTo.autor_nome}</strong>
                {replyingTo.mensagem ? <span className="ml-1 text-slate-400">· {replyingTo.mensagem.substring(0, 50)}{replyingTo.mensagem.length > 50 ? '…' : ''}</span> : null}
              </span>
              <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {ficheiroAnexo && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <Paperclip className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-xs text-blue-700 truncate flex-1">{ficheiroAnexo.name}</span>
              <span className="text-[10px] text-blue-400">({(ficheiroAnexo.size / 1024).toFixed(0)} KB)</span>
              <button onClick={() => { setFicheiroAnexo(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="text-blue-400 hover:text-[#800020] ml-1">
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              id="sala-ficheiro"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={(e) => setFicheiroAnexo(e.target.files?.[0] ?? null)}
            />
            <label htmlFor="sala-ficheiro" className="flex items-center justify-center h-10 w-10 rounded-lg border border-slate-200 hover:border-[#FBBCB8] hover:text-[#800020] text-slate-400 cursor-pointer transition-colors shrink-0">
              <Paperclip className="w-4 h-4" />
            </label>
            <Input
              ref={inputRef}
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void enviarMensagem() } }}
              placeholder={replyingTo ? `Responder a ${replyingTo.autor_nome}…` : 'Escreve uma mensagem…'}
              className="flex-1 resize-none"
            />
            <Button onClick={enviarMensagem} disabled={aEnviar || (!novaMensagem.trim() && !ficheiroAnexo)} className="bg-[#800020] hover:bg-[#5C0016] h-10 w-10 p-0 shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Modal Criar Convite */}
        <Dialog open={showConvidar} onOpenChange={(o) => { setShowConvidar(o); if (!o) setCodigoCriado('') }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Mail className="w-5 h-5" /> Convidar Membros</DialogTitle>
              <DialogDescription>Gera um código de convite ou envia por email.</DialogDescription>
            </DialogHeader>
            {codigoCriado ? (
              <div className="space-y-4 mt-2">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-700 mb-2">Convite criado! Código de acesso:</p>
                  <p className="text-3xl font-bold tracking-widest text-green-900 font-mono">{codigoCriado}</p>
                </div>
                <Button onClick={copiarCodigo} variant="outline" className="w-full gap-2">
                  {copiado ? <><Check className="w-4 h-4 text-green-600" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar Código</>}
                </Button>
                {conviteForm.email_destino && <p className="text-xs text-slate-500 text-center">Email enviado para {conviteForm.email_destino}</p>}
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Email do convidado (opcional)</label>
                  <Input value={conviteForm.email_destino} onChange={(e) => setConviteForm(f => ({ ...f, email_destino: e.target.value }))} placeholder="email@exemplo.com" type="email" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Validade (horas)</label>
                    <Input value={conviteForm.validade_horas} onChange={(e) => setConviteForm(f => ({ ...f, validade_horas: Number(e.target.value) }))} type="number" min={1} max={720} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Usos máximos</label>
                    <Input value={conviteForm.max_usos} onChange={(e) => setConviteForm(f => ({ ...f, max_usos: Number(e.target.value) }))} type="number" min={1} max={100} />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => { setShowConvidar(false); setCodigoCriado('') }}>Fechar</Button>
              {!codigoCriado && (
                <Button onClick={criarConvite} disabled={aCriarConvite} className="bg-[#800020] hover:bg-[#5C0016]">
                  {aCriarConvite ? 'A criar...' : 'Gerar Convite'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Membros */}
        <Dialog open={showMembros} onOpenChange={setShowMembros}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Membros da Sala</DialogTitle>
              <DialogDescription className="sr-only">Gerir membros e permissões da sala de discussão</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {membros.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Nenhum membro ainda.</p>}
              {membros.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                    {m.avatar_url ? (
                      <img src={resolveUploadUrl(m.avatar_url)} alt={m.nome} className="w-full h-full object-cover" />
                    ) : (
                      m.nome.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{m.nome}</p>
                    <div className="flex gap-1 mt-0.5">
                      {m.aprovado ? <Badge variant="outline" className="text-[10px] text-green-700 border-green-300">Aprovado</Badge> : <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">Pendente</Badge>}
                      {m.pode_comentar ? <Badge variant="outline" className="text-[10px] text-blue-700 border-blue-300">Pode comentar</Badge> : <Badge variant="outline" className="text-[10px] text-slate-500">Só leitura</Badge>}
                    </div>
                  </div>
                  {m.id !== user?.id && (
                    <div className="flex gap-1">
                      {!m.aprovado && (
                        <button onClick={() => atualizarMembro(m.id, 'aprovado', true)} className="p-1.5 rounded hover:bg-green-50 text-green-600" title="Aprovar">
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => atualizarMembro(m.id, 'pode_comentar', !m.pode_comentar)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title={m.pode_comentar ? 'Remover permissão de comentar' : 'Permitir comentar'}>
                        {m.pode_comentar ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4 text-blue-500" />}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMembros(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ── Lista de salas ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-[#800020]" /> Salas de Discussão
          </h1>
          <p className="text-slate-500 text-sm mt-1">Espaços privados de conversa geridos por professores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUsarCodigo(true)} className="gap-2">
            <Copy className="w-4 h-4" /> Usar Código
          </Button>
          {isProfessorOuAdmin && (
            <Button onClick={() => setShowCriar(true)} className="bg-[#800020] hover:bg-[#5C0016] gap-2">
              <Plus className="w-4 h-4" /> Nova Sala
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : salas.length === 0 ? (
        <div className="text-center py-16">
          <Lock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="font-medium text-slate-600 mb-1">Nenhuma sala disponível</h3>
          <p className="text-sm text-slate-400">
            {isProfessorOuAdmin ? 'Cria a tua primeira sala de discussão.' : 'Aguarda um convite de um professor.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {salas.map(sala => {
            const podeApagar = sala.criador_id === user?.id || isProfessorOuAdmin
            return (
              <div key={sala.id} className="relative group">
                <button
                  onClick={() => abrirSala(sala)}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-[#FBBCB8] hover:bg-[#FFF2F2] transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FEE8E8] flex items-center justify-center flex-shrink-0 group-hover:bg-[#FDD5D5] transition-colors">
                      <MessageSquare className="w-5 h-5 text-[#800020]" />
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 truncate">{sala.titulo}</h3>
                        {sala.so_membros_comentam ? <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> : null}
                      </div>
                      {sala.descricao && <p className="text-sm text-slate-500 truncate mt-0.5">{sala.descricao}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {sala.total_membros} membros</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {sala.total_mensagens} mensagens</span>
                        <span>criado por {sala.criador_nome}</span>
                      </div>
                    </div>
                  </div>
                </button>
                {podeApagar && (
                  <button
                    onClick={(e) => { e.stopPropagation(); void apagarSala(sala) }}
                    disabled={aApagarSala}
                    className="absolute top-1/2 -translate-y-1/2 right-3 p-1.5 rounded-lg text-slate-300 hover:text-[#800020] hover:bg-[#FFF2F2] transition-colors opacity-0 group-hover:opacity-100"
                    title="Apagar sala"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Usar Código de Convite */}
      <Dialog open={showUsarCodigo} onOpenChange={setShowUsarCodigo}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Copy className="w-5 h-5" /> Usar Código de Convite</DialogTitle>
            <DialogDescription>Introduz o código que recebeste para entrar numa sala ou tópico privado.</DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <Input
              value={codigoConvite}
              onChange={(e) => setCodigoConvite(e.target.value.toUpperCase())}
              placeholder="Ex: AB3K9MQZ"
              className="text-center text-lg font-mono tracking-widest uppercase"
              maxLength={12}
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowUsarCodigo(false)}>Cancelar</Button>
            <Button onClick={usarCodigo} disabled={aUsarCodigo || !codigoConvite.trim()} className="bg-[#800020] hover:bg-[#5C0016]">
              {aUsarCodigo ? 'A verificar...' : 'Entrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Criar Sala */}
      <Dialog open={showCriar} onOpenChange={setShowCriar}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5" /> Nova Sala de Discussão</DialogTitle>
            <DialogDescription>Cria um espaço privado de conversa para os teus alunos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Título *</label>
              <Input
                value={novaSala.titulo}
                onChange={(e) => setNovaSala(s => ({ ...s, titulo: e.target.value }))}
                placeholder="Ex: Turma A — Economia 2024"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Descrição</label>
              <Textarea
                value={novaSala.descricao}
                onChange={(e) => setNovaSala(s => ({ ...s, descricao: e.target.value }))}
                placeholder="Propósito desta sala..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50">
              <input
                type="checkbox"
                id="so-membros"
                checked={novaSala.so_membros_comentam}
                onChange={(e) => setNovaSala(s => ({ ...s, so_membros_comentam: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300"
              />
              <label htmlFor="so-membros" className="text-sm text-slate-700 cursor-pointer">
                Apenas membros aprovados podem comentar
              </label>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCriar(false)}>Cancelar</Button>
            <Button onClick={criarSala} disabled={aCriarSala || !novaSala.titulo.trim()} className="bg-[#800020] hover:bg-[#5C0016]">
              {aCriarSala ? 'A criar...' : 'Criar Sala'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
