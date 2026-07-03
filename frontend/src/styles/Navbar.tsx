import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  BookOpen,
  Bell,
  ChevronDown,
  Compass,
  Home,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  MessagesSquare,
  User,
  X,
} from 'lucide-react'
import { useAuth } from '../app/contexts/AuthContext'
import { apiRequest, resolveUploadUrl } from '../app/services/api'

const navLinks = [
  { label: 'Início', href: '/', icon: Home },
  { label: 'Explorar', href: '/explorar', icon: Compass },
  { label: 'Quizes', href: '/resources', icon: HelpCircle },
  { label: 'Fórum', href: '/forum', icon: MessageSquare },
  { label: 'Salas', href: '/salas', icon: MessagesSquare },
]

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [naoLidas, setNaoLidas] = useState(0)
  // Um administrador só usa o painel de administração — não faz sentido
  // mostrar-lhe links para Explorar, Fórum, Quizzes, etc.
  const linksVisiveis = user?.isAdmin ? [] : navLinks

  // Contagem real de notificações por ler — refrescada ao navegar e a cada 60s
  useEffect(() => {
    if (!isAuthenticated) { setNaoLidas(0); return }

    let ativo = true
    const carregar = async () => {
      try {
        const r = await apiRequest<{ nao_lidas: number }>('/notificacoes?limit=1')
        if (ativo) setNaoLidas(Number(r?.nao_lidas ?? 0))
      } catch { /* sem ligação — mantém o valor atual */ }
    }
    void carregar()
    const id = window.setInterval(carregar, 60000)
    return () => { ativo = false; window.clearInterval(id) }
  }, [isAuthenticated, location.pathname])

  function handleLogout() {
    logout()
    navigate('/')
    setPerfilAberto(false)
    setMenuAberto(false)
  }

  const isActivo = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to={user?.isAdmin ? "/admin" : "/"} className="flex flex-shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5C0016]">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="block text-sm font-bold leading-tight text-slate-900">
                Economia com História
              </span>
              <span className="text-xs text-slate-500">Angola</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {linksVisiveis.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActivo(link.href)
                      ? 'bg-[#FFF2F2] text-[#5C0016]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={user?.isAdmin ? '/admin?tab=notificacoes' : '/notifications'}
                  aria-label={naoLidas > 0 ? `Notificações (${naoLidas} por ler)` : 'Notificações'}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <Bell className="h-4 w-4" />
                  {naoLidas > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#800020] px-1 text-[10px] font-bold leading-none text-white">
                      {naoLidas > 9 ? '9+' : naoLidas}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setPerfilAberto(!perfilAberto)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-100"
                  >
                    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-[#FEE8E8]">
                      {user?.avatarUrl ? (
                        <img
                          src={resolveUploadUrl(user.avatarUrl)}
                          alt={user?.name ?? 'Utilizador'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-[#5C0016]">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="hidden max-w-24 truncate text-sm font-medium text-slate-700 sm:block">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                        perfilAberto ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {perfilAberto && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setPerfilAberto(false)} />
                      <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                        <div className="border-b border-slate-100 px-4 py-3">
                          <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                          <p className="truncate text-xs text-slate-400">{user?.email}</p>
                        </div>
                        {!user?.isAdmin && (
                          <div className="py-1">
                            <Link
                              to="/profile"
                              onClick={() => setPerfilAberto(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                            >
                              <User className="h-4 w-4 text-slate-400" />
                              O meu perfil
                            </Link>
                          </div>
                        )}
                        <div className="border-t border-slate-100 py-1">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#800020] transition-colors hover:bg-[#FFF2F2]"
                          >
                            <LogOut className="h-4 w-4" />
                            Sair
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 text-sm font-semibold text-[#5C0016] transition-colors hover:text-[#5C0016]"
              >
                Entrar
              </Link>
            )}

            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
            >
              {menuAberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {menuAberto && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="space-y-1">
            {linksVisiveis.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMenuAberto(false)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                    isActivo(link.href)
                      ? 'bg-[#FFF2F2] text-[#5C0016]'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}

            {!isAuthenticated && (
              <div className="pt-2">
                <Link
                  to="/login"
                  onClick={() => setMenuAberto(false)}
                  className="block rounded-xl bg-[#5C0016] px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#5C0016]"
                >
                  Login
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
