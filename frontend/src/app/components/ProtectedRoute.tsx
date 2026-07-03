import { Navigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children:      React.ReactNode
  /** Se true, redireciona utilizadores não-admin para a página inicial */
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  // Aguarda a restauração da sessão guardada antes de decidir — evita
  // redirecionar admins ao recarregar/abrir /admin diretamente.
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#800020]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
