import { Outlet, useLocation, Navigate } from 'react-router'
import { useEffect } from 'react'
import Navbar from '../../styles/Navbar'
import Footer from '../../styles/Footer'
import { useAuth } from '../contexts/AuthContext'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function Layout() {
  const { user, isAdmin, loading, logout } = useAuth()
  const { pathname } = useLocation()

  // Conta banida/suspensa: bloqueia toda a plataforma com um aviso.
  // A única ação disponível é terminar a sessão.
  if (!loading && user && user.isActive === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Conta suspensa</h1>
          <p className="text-sm text-slate-600 mb-6">
            A tua conta foi suspensa por um administrador e não podes utilizar a
            plataforma. Se achas que se trata de um engano, contacta a equipa de
            administração.
          </p>
          <button
            onClick={logout}
            className="w-full px-6 py-3 bg-[#800020] hover:bg-[#5C0016] text-white rounded-lg font-semibold text-sm transition-colors"
          >
            Terminar sessão
          </button>
        </div>
      </div>
    )
  }

  // Um administrador só tem acesso ao painel de administração — nada do
  // resto do sistema (Explorar, Home, Fórum, Quiz, Perfil, etc.). Isto é
  // apenas a barreira de navegação; a proteção real de dados/ações fica do
  // lado do backend (roles nas rotas), como sempre.
  if (!loading && isAdmin && pathname !== '/admin') {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
