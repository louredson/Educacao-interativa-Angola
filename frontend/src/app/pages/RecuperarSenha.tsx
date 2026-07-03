import { useState } from 'react'
import { Link } from 'react-router'
import { BookOpen, Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { apiRequest } from '../services/api'

export default function RecuperarSenha() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro,    setErro]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setErro('Introduz o teu email.'); return }
    setErro('')
    setLoading(true)
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        anonymous: true,
        json: { email: email.trim().toLowerCase() },
      })
      setEnviado(true)
    } catch (err: unknown) {
      // Mostra a mensagem real devolvida pelo servidor (email não registado, etc.)
      setErro(err instanceof Error ? err.message : 'Ocorreu um erro. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  // ── Ecrã de sucesso ────────────────────────────────────────────────────────
  if (enviado) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-8 px-4">
        <BrandHeader />
        <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-md px-8 py-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Email enviado!</h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Enviámos um link de recuperação para <strong>{email}</strong>.<br /><br />
            O link expira em <strong>1 hora</strong>. Verifica também a pasta de spam.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-lg
                       bg-[#5C0016] hover:bg-[#5C0016] text-white font-semibold text-sm transition-colors"
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    )
  }

  // ── Formulário ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-8 px-4">
      <BrandHeader />
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-md px-8 py-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-[#5C0016] mb-1">Recuperar senha</h1>
          <p className="text-muted-foreground text-sm">
            Indica o teu email e enviamos um link para redefinires a senha.
          </p>
        </div>

        {erro && (
          <div className="mb-4 px-4 py-3 bg-[#FFF2F2] border border-[#FDD5D5] rounded-lg text-[#5C0016] text-sm">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="o-teu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full h-11 pl-9 pr-4 text-sm border border-border rounded-lg bg-background
                           text-foreground placeholder:text-muted-foreground focus:outline-none
                           focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/30 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-[#5C0016] hover:bg-[#5C0016] text-white font-semibold
                       text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> A enviar…</>
              : <><Mail className="w-4 h-4" /> Enviar link de recuperação</>
            }
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-[#5C0016] font-medium hover:text-[#5C0016] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao login
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
      <span className="font-bold text-foreground text-base leading-tight">Economia com História</span>
      <span className="text-muted-foreground text-xs">Angola</span>
    </div>
  )
}
