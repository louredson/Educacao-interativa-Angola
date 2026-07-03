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
  const { isAdmin, loading } = useAuth()
  const { pathname } = useLocation()

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
