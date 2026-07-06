import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { BookOpen, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react'
import { apiRequest } from '../services/api'

// ── Barra de força ────────────────────────────────────────────────────────────
function calcularForca(s: string): 'fraca' | 'razoavel' | 'forte' {
  if (s.length < 8) return 'fraca'
  const pts = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(s)).length
  if (pts >= 4 && s.length >= 12) return 'forte'
  return pts >= 3 ? 'razoavel' : 'fraca'
}

const FORCA_CFG = {
  fraca:    { w: 'w-1/3',  bg: 'bg-[#800020]',   label: 'Fraca',    c: 'text-[#800020]'   },
  razoavel: { w: 'w-2/3',  bg: 'bg-amber-400', label: 'Razoável', c: 'text-amber-600' },
  forte:    { w: 'w-full', bg: 'bg-green-500',  label: 'Forte',    c: 'text-green-600' },
}

export default function RedefinirSenha() {
  const [searchParams]        = useSearchParams()
  const navigate              = useNavigate()
  const token                 = searchParams.get('token') ?? ''

  const [nova,         setNova]         = useState('')
  const [confirmar,    setConfirmar]    = useState('')
  const [mostrarNova,  setMostrarNova]  = useState(false)
  const [mostrarConf,  setMostrarConf]  = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [erro,         setErro]         = useState('')
  const [concluido,    setConcluido]    = useState(false)
  const [tokenInvalido, setTokenInvalido] = useState(!token)
  const [contagem,     setContagem]     = useState(5)

  // Contagem regressiva após sucesso
  useEffect(() => {
    if (!concluido) return
    const t = setInterval(() => setContagem((n) => {
      if (n <= 1) { clearInterval(t); navigate('/login') }
      return n - 1
    }), 1000)
    return () => clearInterval(t)
  }, [concluido, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (nova.length < 8)       { setErro('A senha deve ter pelo menos 8 caracteres.'); return }
    if (nova !== confirmar)     { setErro('As senhas não coincidem.'); return }

    setLoading(true)
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        anonymous: true,
        json: { token, password: nova },
      })
      setConcluido(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocorreu um erro.'
      setErro(msg)
      if (msg.toLowerCase().includes('inválido') || msg.toLowerCase().includes('expirado')) {
        setTimeout(() => setTokenInvalido(true), 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  const forca = nova ? calcularForca(nova) : null
  const fcfg  = forca ? FORCA_CFG[forca] : null

  const inputBase = `w-full h-11 pl-9 pr-10 text-sm border border-border rounded-lg bg-background
    text-foreground placeholder:text-muted-foreground focus:outline-none
    focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/30 transition-colors`

  // ── Token inválido ─────────────────────────────────────────────────────────
  if (tokenInvalido) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-8 px-4">
      <BrandHeader />
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-md px-8 py-10 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Link inválido</h1>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Este link de recuperação é inválido ou expirou.<br />
          Os links têm validade de <strong>1 hora</strong>. Solicita um novo.
        </p>
        <Link to="/recuperar-senha"
          className="flex items-center justify-center gap-2 w-full h-11 rounded-lg
                     bg-[#5C0016] hover:bg-[#5C0016] text-white font-semibold text-sm transition-colors">
          Solicitar novo link
        </Link>
        <p className="text-sm text-muted-foreground mt-4">
          <Link to="/login" className="text-[#5C0016] hover:text-[#5C0016] font-medium">← Voltar ao login</Link>
        </p>
      </div>
    </div>
  )

  // ── Sucesso ────────────────────────────────────────────────────────────────
  if (concluido) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-8 px-4">
      <BrandHeader />
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-md px-8 py-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Senha redefinida!</h1>
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
          A tua senha foi alterada com sucesso.<br />Já podes entrar com a nova senha.
        </p>
        <p className="text-xs text-muted-foreground mb-5 bg-muted border border-border rounded-lg py-2 px-4">
          A redirecionar em <strong>{contagem}s</strong>…
        </p>
        <Link to="/login"
          className="flex items-center justify-center gap-2 w-full h-11 rounded-lg
                     bg-[#5C0016] hover:bg-[#5C0016] text-white font-semibold text-sm transition-colors">
          Entrar agora →
        </Link>
      </div>
    </div>
  )

  // ── Formulário principal ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-8 px-4">
      <BrandHeader />
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-md px-8 py-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-[#5C0016] mb-1">Definir nova senha</h1>
          <p className="text-muted-foreground text-sm">
            Escolhe uma senha forte com pelo menos 8 caracteres.
          </p>
        </div>

        {erro && (
          <div className="mb-4 px-4 py-3 bg-[#FFF2F2] border border-[#FDD5D5] rounded-lg text-[#5C0016] text-sm">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Nova senha */}
          <div className="space-y-1">
            <label className="block text-sm text-foreground">Nova senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type={mostrarNova ? 'text' : 'password'} value={nova}
                onChange={(e) => setNova(e.target.value)}
                placeholder="Mínimo 8 caracteres" autoComplete="new-password"
                className={inputBase} />
              <button type="button" onClick={() => setMostrarNova(!mostrarNova)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {mostrarNova ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {nova && fcfg && (
              <div className="pt-1 space-y-0.5">
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${fcfg.w} ${fcfg.bg}`} />
                </div>
                <span className={`text-xs font-medium ${fcfg.c}`}>Força: {fcfg.label}</span>
              </div>
            )}
          </div>

          {/* Confirmar */}
          <div className="space-y-1">
            <label className="block text-sm text-foreground">Confirmar senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type={mostrarConf ? 'text' : 'password'} value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repete a senha" autoComplete="new-password"
                className={`${inputBase} ${confirmar && nova !== confirmar ? 'border-[#A0002A] bg-[#FFF2F2]' : ''}`} />
              <button type="button" onClick={() => setMostrarConf(!mostrarConf)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {mostrarConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmar && nova !== confirmar && (
              <p className="text-xs text-[#800020]">As senhas não coincidem.</p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full h-11 rounded-lg bg-[#5C0016] hover:bg-[#5C0016] text-white font-semibold
                       text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 mt-2">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> A redefinir…</>
              : <><Lock className="w-4 h-4" /> Definir nova senha</>
            }
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link to="/login"
            className="inline-flex items-center gap-1 text-[#5C0016] font-medium hover:text-[#5C0016] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}

function BrandHeader() {
  return (
    <div className="flex flex-col items-center gap-1 mb-6">
      <div className="w-12 h-12 bg-[#5C0016] rounded-xl flex items-center justify-center shadow-sm">
        <BookOpen className="w-6 h-6 text-white" />
      </div>
      <span className="font-bold text-foreground text-base">Economia com História</span>
      <span className="text-muted-foreground text-xs">Angola</span>
    </div>
  )
}
