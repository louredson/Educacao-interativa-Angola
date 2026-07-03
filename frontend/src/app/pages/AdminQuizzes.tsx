/**
import { toast } from 'sonner';
 * AdminQuizzes.tsx
 *
 * Página de gestão de quizzes do painel admin — Economia com História.
 *
 * Pontos cobertos:
 *  PONTO 1  — lista separada: "Todos os Quizzes" (staff vê tudo) vs alunos
 *  PONTO 3  — aba "Os Meus Quizzes" (GET /quizzes/meus)
 *  PONTO 4  — painel lateral "Gerar com IA" (POST /quizzes/gerar-ia)
 *  PONTO 8  — ownership: botões Editar/Apagar só aparecem nos quizzes do próprio admin
 *             (superadmin vê todos os botões)
 *  PONTO 9  — criação via POST /quizzes/completo
 *  PONTO 10 — edição via PUT /quizzes/:id/completo (replace-all)
 */

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiRequest } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '../components/ui/dialog'

import {
  FileQuestion, PlusCircle, Trash2, Edit, Home, Compass,
  MessageSquare, HelpCircle, Shield, LogOut, Menu, X,
  BookOpen, AlertTriangle, CheckCircle, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, Save, ArrowLeft, Sparkles, Loader2,
  Eye, EyeOff,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface PerguntaForm {
  pergunta: string
  opcao_a: string
  opcao_b: string
  opcao_c: string
  opcao_d: string
  resposta_correta: number
  explicacao: string
}

interface QuizForm {
  titulo: string
  descricao: string
  categoria: string
}

interface IaForm {
  tema: string
  quantidade: string
  dificuldade: string
  publico: string
}

const perguntaVazia = (): PerguntaForm => ({
  pergunta: '', opcao_a: '', opcao_b: '', opcao_c: '', opcao_d: '',
  resposta_correta: 1, explicacao: '',
})

const CATEGORIAS   = ['Economia', 'História', 'Sociedade', 'Cultura', 'Geografia', 'Geral']
const DIFICULDADES = [
  { value: 'facil',   label: 'Fácil' },
  { value: 'medio',   label: 'Médio' },
  { value: 'dificil', label: 'Difícil' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminQuizzes() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const formRef  = useRef<HTMLDivElement>(null)

  // ── Dados ─────────────────────────────────────────────────────────────────
  const [todosQuizzes, setTodosQuizzes] = useState<any[]>([])
  const [meusQuizzes, setMeusQuizzes]   = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [abaAtiva, setAbaAtiva]         = useState<'todos' | 'meus'>('todos')
  const [togglingId, setTogglingId]     = useState<number | null>(null)

  // ── Formulário quiz ───────────────────────────────────────────────────────
  const [editingId, setEditingId]     = useState<number | null>(null)
  const [quizForm, setQuizForm]       = useState<QuizForm>({ titulo: '', descricao: '', categoria: '' })
  const [perguntas, setPerguntas]     = useState<PerguntaForm[]>([perguntaVazia()])
  const [saving, setSaving]           = useState(false)
  const [formError, setFormError]     = useState<string | null>(null)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0)

  // ── Painel IA ─────────────────────────────────────────────────────────────
  const [mostrarIA, setMostrarIA]   = useState(false)
  const [iaForm, setIaForm]         = useState<IaForm>({ tema: '', quantidade: '8', dificuldade: 'medio', publico: '' })
  const [gerandoIA, setGerandoIA]   = useState(false)
  const [iaErro, setIaErro]         = useState<string | null>(null)

  // ── Modal apagar ──────────────────────────────────────────────────────────
  const [deleteId, setDeleteId]       = useState<number | null>(null)
  const [deleteTitle, setDeleteTitle] = useState('')
  const [deleting, setDeleting]       = useState(false)

  // ── Mobile menu ───────────────────────────────────────────────────────────
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ─────────────────────────────────────────────────────────────────────────
  // Efeitos
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) { navigate('/'); return }
    void carregarTudo()
  }, [isAuthenticated, user, navigate])

  // ─────────────────────────────────────────────────────────────────────────
  // Dados
  // ─────────────────────────────────────────────────────────────────────────

  const carregarTudo = async () => {
    setLoading(true)
    try {
      const [todos, meus] = await Promise.all([
        apiRequest<any[]>('/quizzes'),
        apiRequest<any[]>('/quizzes/meus'),
      ])
      setTodosQuizzes(todos ?? [])
      setMeusQuizzes(meus ?? [])
    } catch {
      setTodosQuizzes([])
      setMeusQuizzes([])
    } finally {
      setLoading(false)
    }
  }

  // PONTO 8 — verifica se o utilizador pode editar/apagar o quiz
  const podeEditar = (quiz: any): boolean => {
    if (user?.role === 'superadmin') return true
    return quiz.criado_por === user?.id
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Formulário — perguntas
  // ─────────────────────────────────────────────────────────────────────────

  const adicionarPergunta = () => {
    const idx = perguntas.length
    setPerguntas(prev => [...prev, perguntaVazia()])
    setExpandedIdx(idx)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100)
  }

  const removerPergunta = (idx: number) => {
    if (perguntas.length === 1) return
    setPerguntas(prev => prev.filter((_, i) => i !== idx))
    setExpandedIdx(prev => prev === idx ? null : prev !== null && prev > idx ? prev - 1 : prev)
  }

  const updatePergunta = (idx: number, field: keyof PerguntaForm, value: string | number) => {
    setPerguntas(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Validação
  // ─────────────────────────────────────────────────────────────────────────

  const validar = (): string | null => {
    if (!quizForm.titulo.trim()) return 'O título do quiz é obrigatório.'
    if (!perguntas.length)       return 'Adiciona pelo menos uma pergunta.'
    for (let i = 0; i < perguntas.length; i++) {
      const p = perguntas[i]
      if (!p.pergunta.trim()) return `Pergunta ${i + 1}: falta o texto.`
      if (!p.opcao_a.trim())  return `Pergunta ${i + 1}: falta a opção A.`
      if (!p.opcao_b.trim())  return `Pergunta ${i + 1}: falta a opção B.`
      if (!p.opcao_c.trim())  return `Pergunta ${i + 1}: falta a opção C.`
      if (!p.opcao_d.trim())  return `Pergunta ${i + 1}: falta a opção D.`
    }
    return null
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Guardar — PONTO 9 (criar) e PONTO 10 (editar)
  // ─────────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setFormError(null)
    const erro = validar()
    if (erro) { setFormError(erro); return }

    const payload = {
      titulo:        quizForm.titulo.trim(),
      descricao:     quizForm.descricao.trim() || null,
      categoria:     quizForm.categoria || null,
      perguntas: perguntas.map((p, i) => ({
        pergunta:         p.pergunta.trim(),
        opcao_a:          p.opcao_a.trim(),
        opcao_b:          p.opcao_b.trim(),
        opcao_c:          p.opcao_c.trim(),
        opcao_d:          p.opcao_d.trim(),
        resposta_correta: Number(p.resposta_correta),
        explicacao:       p.explicacao.trim() || null,
        ordem:            i + 1,
      })),
    }

    setSaving(true)
    try {
      if (editingId === null) {
        await apiRequest('/quizzes/completo', { method: 'POST', json: payload })
      } else {
        await apiRequest(`/quizzes/${editingId}/completo`, { method: 'PUT', json: payload })
      }
      resetFormulario()
      await carregarTudo()
    } catch (err: any) {
      setFormError(err?.message ?? 'Erro ao guardar. Tenta novamente.')
    } finally {
      setSaving(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Editar — carrega dados na form
  // ─────────────────────────────────────────────────────────────────────────

  const handleEditar = async (quiz: any) => {
    setFormError(null)
    setEditingId(quiz.id)
    setQuizForm({ titulo: quiz.titulo ?? '', descricao: quiz.descricao ?? '', categoria: quiz.categoria ?? '' })
    setMostrarIA(false)

    try {
      const detalhe = await apiRequest<any>(`/quizzes/${quiz.id}`)
      if (Array.isArray(detalhe.perguntas) && detalhe.perguntas.length > 0) {
        setPerguntas(detalhe.perguntas.map((p: any) => ({
          pergunta:         p.pergunta         ?? '',
          opcao_a:          p.opcao_a          ?? '',
          opcao_b:          p.opcao_b          ?? '',
          opcao_c:          p.opcao_c          ?? '',
          opcao_d:          p.opcao_d          ?? '',
          resposta_correta: Number(p.resposta_correta ?? 1),
          explicacao:       p.explicacao       ?? '',
        })))
      } else {
        setPerguntas([perguntaVazia()])
      }
    } catch { setPerguntas([perguntaVazia()]) }

    setExpandedIdx(0)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PONTO 4 — Gerar com IA
  // ─────────────────────────────────────────────────────────────────────────

  const handleGerarIA = async () => {
    setIaErro(null)
    if (!iaForm.tema.trim()) { setIaErro('O tema é obrigatório.'); return }

    setGerandoIA(true)
    try {
      const resultado = await apiRequest<any>('/quizzes/gerar-ia', {
        method: 'POST',
        json: {
          tema:        iaForm.tema.trim(),
          quantidade:  Number(iaForm.quantidade) || 8,
          dificuldade: iaForm.dificuldade,
          publico:     iaForm.publico.trim() || undefined,
        },
      })

      // Preenche o formulário com o resultado gerado — admin revê antes de guardar
      setQuizForm({
        titulo:    resultado.titulo    ?? '',
        descricao: resultado.descricao ?? '',
        categoria: resultado.categoria ?? '',
      })
      if (Array.isArray(resultado.perguntas)) {
        setPerguntas(resultado.perguntas.map((p: any) => ({
          pergunta:         p.pergunta         ?? '',
          opcao_a:          p.opcao_a          ?? '',
          opcao_b:          p.opcao_b          ?? '',
          opcao_c:          p.opcao_c          ?? '',
          opcao_d:          p.opcao_d          ?? '',
          resposta_correta: Number(p.resposta_correta ?? 1),
          explicacao:       p.explicacao       ?? '',
        })))
      }

      setExpandedIdx(0)
      setMostrarIA(false)
      setEditingId(null)
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
    } catch (err: any) {
      setIaErro(err?.message ?? 'Erro ao gerar quiz. Tenta novamente.')
    } finally {
      setGerandoIA(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Toggle activo
  // ─────────────────────────────────────────────────────────────────────────

  const handleToggleAtivo = async (quiz: any) => {
    setTogglingId(quiz.id)
    try {
      await apiRequest(`/quizzes/${quiz.id}`, { method: 'PUT', json: { ativo: !quiz.ativo } })
      const atualizar = (list: any[]) => list.map(q => q.id === quiz.id ? { ...q, ativo: !q.ativo } : q)
      setTodosQuizzes(atualizar)
      setMeusQuizzes(atualizar)
    } catch (err: any) {
      toast.error(err?.message ?? 'Não foi possível alterar o estado.')
    } finally {
      setTogglingId(null)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Apagar
  // ─────────────────────────────────────────────────────────────────────────

  const handleApagar = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await apiRequest(`/quizzes/${deleteId}`, { method: 'DELETE' })
      const filtrar = (list: any[]) => list.filter(q => q.id !== deleteId)
      setTodosQuizzes(filtrar)
      setMeusQuizzes(filtrar)
      if (editingId === deleteId) resetFormulario()
    } catch (err: any) {
      toast.error(err?.message ?? 'Não foi possível apagar.')
    } finally {
      setDeleteId(null); setDeleteTitle(''); setDeleting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────────────────────────────────────

  const resetFormulario = () => {
    setEditingId(null)
    setQuizForm({ titulo: '', descricao: '', categoria: '' })
    setPerguntas([perguntaVazia()])
    setExpandedIdx(0)
    setFormError(null)
  }

  if (!user?.isAdmin) return null

  const listaAtiva = abaAtiva === 'meus' ? meusQuizzes : todosQuizzes

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5C0016]">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="hidden sm:block text-sm font-bold text-slate-900">Economia com História</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {[
                { label: 'Início',   href: '/',          Icon: Home },
                { label: 'Explorar', href: '/artigos',   Icon: Compass },
                { label: 'Quizes',   href: '/resources', Icon: HelpCircle },
                { label: 'Fórum',    href: '/forum',     Icon: MessageSquare },
              ].map(({ label, href, Icon }) => (
                <Link key={href} to={href} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              ))}
              <span className="mx-1 h-5 w-px bg-slate-200" />
              <Link to="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-[#5C0016] hover:bg-[#FFF2F2] transition-colors">
                <Shield className="w-4 h-4" /> Admin
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => { logout(); navigate('/') }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#800020] hover:bg-[#FFF2F2] transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden transition-colors">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden space-y-1">
            {[
              { label: 'Início', href: '/', Icon: Home }, { label: 'Explorar', href: '/artigos', Icon: Compass },
              { label: 'Quizes', href: '/resources', Icon: HelpCircle }, { label: 'Debate', href: '/forum', Icon: MessageSquare },
              { label: 'Admin',  href: '/admin', Icon: Shield },
            ].map(({ label, href, Icon }) => (
              <Link key={href} to={href} onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#800020] via-black to-yellow-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-2">
            <FileQuestion className="w-9 h-9" />
            <div>
              <h1 className="text-3xl font-bold">Gestão de Quizzes</h1>
              <p className="text-white/80 text-sm">Cria, edita e organiza quizzes — podes usar IA para gerar perguntas</p>
            </div>
          </div>
          <Link to="/admin" className="inline-flex items-center gap-1.5 mt-3 text-sm text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* ── PONTO 4 — Painel Gerar com IA ─────────────────────────────────── */}
        <Card className="border-orange-200">
          <CardHeader
            className="cursor-pointer select-none flex flex-row items-center justify-between gap-4 py-4"
            onClick={() => setMostrarIA(!mostrarIA)}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <div>
                <CardTitle className="text-base">Gerar Quiz com IA</CardTitle>
                <CardDescription className="text-sm">A IA cria o título, descrição e perguntas. Tu reeves e guardas.</CardDescription>
              </div>
            </div>
            {mostrarIA ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </CardHeader>

          {mostrarIA && (
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Tema <span className="text-[#800020]">*</span>
                  </label>
                  <Input
                    placeholder="Ex: Independência de Angola, Inflação, Escravatura..."
                    value={iaForm.tema}
                    onChange={e => setIaForm(f => ({ ...f, tema: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Quantidade de Perguntas</label>
                  <select
                    value={iaForm.quantidade}
                    onChange={e => setIaForm(f => ({ ...f, quantidade: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    {[3, 5, 8, 10, 12, 15].map(n => <option key={n} value={n}>{n} perguntas</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Dificuldade</label>
                  <select
                    value={iaForm.dificuldade}
                    onChange={e => setIaForm(f => ({ ...f, dificuldade: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    {DIFICULDADES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Público-alvo</label>
                  <select
                    value={iaForm.publico}
                    onChange={e => setIaForm(f => ({ ...f, publico: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    <option value="">Público geral</option>
                    <option value="alunos do ensino secundário (10.º ao 12.º ano)">Ensino Secundário (10.º–12.º ano)</option>
                    <option value="estudantes universitários de economia ou gestão">Universitários — Economia / Gestão</option>
                    <option value="estudantes universitários de história ou ciências sociais">Universitários — História / Ciências Sociais</option>
                    <option value="professores e educadores do ensino secundário">Professores e Educadores</option>
                    <option value="profissionais e técnicos da área económica">Profissionais de Economia</option>
                    <option value="investigadores e académicos">Investigadores e Académicos</option>
                  </select>
                </div>
              </div>

              {iaErro && (
                <div className="flex items-start gap-2 p-3 bg-[#FFF2F2] border border-[#FDD5D5] rounded-lg text-sm text-[#5C0016]">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {iaErro}
                </div>
              )}

              <Button
                onClick={handleGerarIA}
                disabled={gerandoIA}
                className="w-full bg-orange-500 hover:bg-orange-600 gap-2 flex items-center justify-center"
              >
                {gerandoIA
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> A gerar quiz...</>
                  : <><Sparkles className="w-4 h-4" /> Gerar Quiz com IA</>
                }
              </Button>
            </CardContent>
          )}
        </Card>

        {/* ── Lista de quizzes — abas ─────────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-orange-600" /> Quizzes
              </CardTitle>
            </div>
            <Button onClick={resetFormulario} className="bg-[#800020] hover:bg-[#5C0016] shrink-0" size="sm">
              <PlusCircle className="w-4 h-4 mr-1.5" /> Novo Quiz
            </Button>
          </CardHeader>

          {/* Abas PONTO 1 + PONTO 3 */}
          <div className="px-6 flex gap-1 border-b border-slate-200">
            <button
              onClick={() => setAbaAtiva('todos')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                abaAtiva === 'todos'
                  ? 'border-[#800020] text-[#5C0016]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Todos ({todosQuizzes.length})
            </button>
            <button
              onClick={() => setAbaAtiva('meus')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                abaAtiva === 'meus'
                  ? 'border-[#800020] text-[#5C0016]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Os Meus ({meusQuizzes.length})
            </button>
          </div>

          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : listaAtiva.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileQuestion className="w-14 h-14 mx-auto mb-3 opacity-30" />
                <p>{abaAtiva === 'meus' ? 'Ainda não criaste nenhum quiz.' : 'Não há quizzes na plataforma.'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {listaAtiva.map((quiz: any) => (
                  <div key={quiz.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-orange-200 transition-colors">

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${quiz.ativo ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{quiz.titulo}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          {quiz.categoria && <Badge variant="secondary" className="text-xs">{quiz.categoria}</Badge>}
                          <span className="text-xs text-slate-400">{quiz.total_perguntas ?? 0} pergunta{(quiz.total_perguntas ?? 0) !== 1 ? 's' : ''}</span>
                          {quiz.total_tentativas != null && (
                            <span className="text-xs text-slate-400">{quiz.total_tentativas} tentativa{quiz.total_tentativas !== 1 ? 's' : ''}</span>
                          )}
                          <span className={`text-xs font-medium ${quiz.ativo ? 'text-green-600' : 'text-slate-400'}`}>
                            {quiz.ativo ? 'Activo' : 'Inactivo'}
                          </span>
                          {/* PONTO 8 — indicador de ownership */}
                          {!podeEditar(quiz) && (
                            <span className="text-xs text-slate-400 italic">de outro admin</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Toggle só disponível para quem pode editar — PONTO 8 */}
                      {podeEditar(quiz) && (
                        <button
                          onClick={() => handleToggleAtivo(quiz)}
                          disabled={togglingId === quiz.id}
                          title={quiz.ativo ? 'Desactivar' : 'Activar'}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40"
                        >
                          {quiz.ativo
                            ? <ToggleRight className="w-5 h-5 text-green-600" />
                            : <ToggleLeft  className="w-5 h-5" />}
                        </button>
                      )}

                      {podeEditar(quiz) ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEditar(quiz)} className="gap-1">
                            <Edit className="w-3.5 h-3.5" /> Editar
                          </Button>
                          <Button size="sm" variant="outline"
                            onClick={() => { setDeleteId(quiz.id); setDeleteTitle(quiz.titulo) }}
                            className="text-[#800020] border-[#FDD5D5] hover:bg-[#FFF2F2] gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Apagar
                          </Button>
                        </>
                      ) : (
                        /* Quiz de outro admin — só leitura */
                        <span className="flex items-center gap-1 text-xs text-slate-400 px-2">
                          <EyeOff className="w-3.5 h-3.5" /> Só leitura
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Formulário criar / editar ──────────────────────────────────────── */}
        <div ref={formRef}>
          <Card id="quiz-form">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingId !== null
                  ? <><Edit className="w-5 h-5 text-orange-500" /> Editar Quiz</>
                  : <><PlusCircle className="w-5 h-5 text-orange-600" /> Criar Novo Quiz</>}
              </CardTitle>
              <CardDescription>
                {editingId !== null
                  ? 'Ao guardar, todas as perguntas anteriores serão substituídas pelas novas.'
                  : 'Preenche os dados e as perguntas. Tudo é guardado de uma vez.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Metadados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Título <span className="text-[#800020]">*</span></label>
                  <Input
                    placeholder="Ex: Economia Angolana — Básico"
                    value={quizForm.titulo}
                    onChange={e => setQuizForm(f => ({ ...f, titulo: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Categoria</label>
                  <select
                    value={quizForm.categoria}
                    onChange={e => setQuizForm(f => ({ ...f, categoria: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800020] bg-white"
                  >
                    <option value="">Selecionar...</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Descrição</label>
                  <Textarea
                    placeholder="Breve descrição do quiz..."
                    value={quizForm.descricao}
                    onChange={e => setQuizForm(f => ({ ...f, descricao: e.target.value }))}
                    rows={2} className="resize-none"
                  />
                </div>

              </div>

              {/* Perguntas em acordeão */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">
                    Perguntas <span className="text-slate-400 font-normal text-sm">({perguntas.length})</span>
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={adicionarPergunta}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50 gap-1">
                    <PlusCircle className="w-4 h-4" /> Adicionar Pergunta
                  </Button>
                </div>

                <div className="space-y-3">
                  {perguntas.map((p, idx) => {
                    const aberto = expandedIdx === idx
                    return (
                      <div key={idx}
                        className={`border rounded-xl overflow-hidden transition-colors ${aberto ? 'border-orange-300 bg-orange-50/30' : 'border-slate-200 bg-white'}`}>
                        <div
                          className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                          onClick={() => setExpandedIdx(aberto ? null : idx)}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full shrink-0">#{idx + 1}</span>
                            <span className="text-sm text-slate-700 truncate">
                              {p.pergunta.trim() || <span className="text-slate-400 italic">Pergunta sem texto</span>}
                            </span>
                            {p.pergunta.trim() && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {perguntas.length > 1 && (
                              <button type="button"
                                onClick={e => { e.stopPropagation(); removerPergunta(idx) }}
                                className="p-1 text-[#A0002A] hover:text-[#800020] transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            {aberto ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        {aberto && (
                          <div className="px-4 pb-5 space-y-4 border-t border-orange-100">
                            <div className="space-y-1.5 pt-4">
                              <label className="text-sm font-medium text-slate-700">Texto da Pergunta <span className="text-[#800020]">*</span></label>
                              <Textarea
                                placeholder="Escreve a pergunta..."
                                value={p.pergunta}
                                onChange={e => updatePergunta(idx, 'pergunta', e.target.value)}
                                rows={2} className="resize-none"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {(['opcao_a', 'opcao_b', 'opcao_c', 'opcao_d'] as const).map((campo, oi) => (
                                <div key={campo} className="space-y-1.5">
                                  <label className="text-sm font-medium text-slate-700">
                                    Opção {['A', 'B', 'C', 'D'][oi]} <span className="text-[#800020]">*</span>
                                  </label>
                                  <Input
                                    placeholder={`Opção ${['A', 'B', 'C', 'D'][oi]}`}
                                    value={p[campo]}
                                    onChange={e => updatePergunta(idx, campo, e.target.value)}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Resposta Correcta <span className="text-[#800020]">*</span></label>
                                <select
                                  value={p.resposta_correta}
                                  onChange={e => updatePergunta(idx, 'resposta_correta', Number(e.target.value))}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800020] bg-white"
                                >
                                  <option value={1}>A — {p.opcao_a || 'Opção A'}</option>
                                  <option value={2}>B — {p.opcao_b || 'Opção B'}</option>
                                  <option value={3}>C — {p.opcao_c || 'Opção C'}</option>
                                  <option value={4}>D — {p.opcao_d || 'Opção D'}</option>
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Explicação (opcional)</label>
                                <Input
                                  placeholder="Porquê esta resposta é correcta..."
                                  value={p.explicacao}
                                  onChange={e => updatePergunta(idx, 'explicacao', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {formError && (
                <div className="flex items-start gap-2 p-3 bg-[#FFF2F2] border border-[#FDD5D5] rounded-lg text-sm text-[#5C0016]">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t">
                {editingId !== null && (
                  <Button type="button" variant="outline" onClick={resetFormulario}>Cancelar</Button>
                )}
                <Button onClick={handleSave} disabled={saving} className="bg-[#800020] hover:bg-[#5C0016] flex-1 gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'A guardar...' : editingId !== null ? 'Guardar Alterações' : 'Criar Quiz'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Modal apagar ────────────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={open => { if (!open) { setDeleteId(null); setDeleteTitle('') } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <AlertTriangle className="w-5 h-5 text-[#800020]" /> Apagar Quiz
            </DialogTitle>
            <DialogDescription>
              Tens a certeza que queres apagar <strong>"{deleteTitle}"</strong>?
              Esta acção remove todas as perguntas e tentativas associadas e não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDeleteId(null); setDeleteTitle('') }}>Cancelar</Button>
            <Button onClick={handleApagar} disabled={deleting} className="bg-[#800020] hover:bg-[#5C0016]">
              {deleting ? 'A apagar...' : 'Apagar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
