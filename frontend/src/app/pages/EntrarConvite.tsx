import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { BookOpen, Loader2, CheckCircle2, AlertTriangle, Users, Lock } from 'lucide-react'
import { apiRequest } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function EntrarConvite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const codigo = (searchParams.get('codigo') ?? '').trim().toUpperCase()

  const [estado, setEstado] = useState<'a-processar' | 'sucesso' | 'erro' | 'sem-sessao'>('a-processar')
  const [erro, setErro] = useState('')
  const [destino, setDestino] = useState<{ tipo: string; entidade_id: number } | null>(null)

  useEffect(() => {
    if (authLoading) return // aguarda a sessão restaurar antes de decidir

    if (!codigo) {
      setEstado('erro')
      setErro('Este link de convite está incompleto — falta o código.')
      return
    }

    if (!isAuthenticated) {
      // Guarda o código para o Login/Registo continuar este fluxo depois de autenticar.
      sessionStorage.setItem('pendingInviteCode', codigo)
      setEstado('sem-sessao')
      return
    }

    ;(async () => {
      try {
        const res = await apiRequest<{ message: string; tipo: string; entidade_id: number }>('/convites/usar', {
          method: 'POST',
          json: { codigo },
        })
        setDestino({ tipo: res.tipo, entidade_id: res.entidade_id })
        setEstado('sucesso')
      } catch (err: unknown) {
        setErro(err instanceof Error ? err.message : 'Não foi possível aceitar o convite.')
        setEstado('erro')
      }
    })()
  }, [codigo, isAuthenticated, authLoading])

  function irParaDestino() {
    if (!destino) return
    navigate(destino.tipo === 'sala' ? '/salas' : `/forum?topico=${destino.entidade_id}`)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-8 px-4">
      <BrandHeader />
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-md px-8 py-10 text-center">
        {estado === 'a-processar' && (
          <>
            <Loader2 className="w-10 h-10 text-[#800020] animate-spin mx-auto mb-4" />
            <h1 className="text-lg font-bold text-foreground">A validar o teu convite…</h1>
          </>
        )}

        {estado === 'sem-sessao' && (
          <>
            <div className="w-16 h-16 bg-[#FFF2F2] rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[#800020]" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Precisas de iniciar sessão</h1>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Para aceitares este convite, entra ou cria uma conta gratuita. Depois de autenticado,
              o convite é aceite automaticamente.
            </p>
            <div className="space-y-2">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-lg
                           bg-[#5C0016] hover:bg-[#5C0016] text-white font-semibold text-sm transition-colors"
              >
                Iniciar sessão / Criar conta
              </Link>
            </div>
          </>
        )}

        {estado === 'sucesso' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Convite aceite!</h1>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              {destino?.tipo === 'sala'
                ? 'Já és membro desta sala de discussão.'
                : 'Já tens acesso a este tópico privado.'}
            </p>
            <button
              onClick={irParaDestino}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-lg
                         bg-[#5C0016] hover:bg-[#5C0016] text-white font-semibold text-sm transition-colors"
            >
              <Users className="w-4 h-4" />
              {destino?.tipo === 'sala' ? 'Ir para a sala' : 'Ir para o tópico'}
            </button>
          </>
        )}

        {estado === 'erro' && (
          <>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Não foi possível aceitar</h1>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{erro}</p>
            <Link to="/" className="text-[#5C0016] hover:text-[#5C0016] font-medium text-sm">
              ← Voltar à página inicial
            </Link>
          </>
        )}
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
