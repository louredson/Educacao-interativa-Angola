import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  BookOpen,
  Bell,
  ChevronDown,
  Compass,
  FileText,
  Home,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  User,
  X,
} from 'lucide-react'
import { useAuth } from '../app/contexts/AuthContext'

const navLinks = [
  { label: 'Início',   href: '/',         icon: Home },
  { label: 'Explorar', href: '/explorar', icon: Compass },
  { label: 'Artigos',  href: '/artigos',  icon: FileText },
  { label: 'Quizes',   href: '/resources', icon: HelpCircle },
  { label: 'Debate',   href: '/forum',     icon: MessageSquare },
]

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  const [perfilAberto, setPerfilAberto] = useState(false)

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
          <Link to="/" className="flex flex-shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-700">
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
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActivo(link.href)
                      ? 'bg-red-50 text-red-700'
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
                  to="/notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-600" />
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setPerfilAberto(!perfilAberto)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-100"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100">
                      <span className="text-xs font-bold text-red-700">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
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
                        <div className="py-1">
                          <Link
                            to="/profile"
                            onClick={() => setPerfilAberto(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            <User className="h-4 w-4 text-slate-400" />
                            O meu perfil
                          </Link>
                          {user?.isAdmin && (
                            <Link
                              to="/admin"
                              onClick={() => setPerfilAberto(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                            >
                              <LayoutDashboard className="h-4 w-4 text-slate-400" />
                              Painel Admin
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-slate-100 py-1">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
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
                className="px-5 py-2 text-sm font-semibold text-red-700 transition-colors hover:text-red-800"
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
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMenuAberto(false)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                    isActivo(link.href)
                      ? 'bg-red-50 text-red-700'
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
                  className="block rounded-xl bg-red-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-red-800"
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
