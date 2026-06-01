import { createBrowserRouter } from 'react-router'
import Home               from './pages/Home'
import Login              from './pages/Login'
import Timeline           from './pages/Timeline'
import Modules            from './pages/Modules'
import Resources          from './pages/Resources'
import Forum              from './pages/Forum'
import Profile            from './pages/Profile'
import AdminDashboard     from './pages/AdminDashboard'
import Explorar           from './pages/Explorar'
import Notifications      from './pages/Notifications'
import PerguntasFrequentes from './pages/perguntasFrequentes'
import RecuperarSenha     from './pages/RecuperarSenha'
import RedefinirSenha     from './pages/RedefinirSenha'
import Layout             from './components/Layout'
import ProtectedRoute     from './components/ProtectedRoute'

export const router = createBrowserRouter([
  // ── Rotas públicas sem Layout ────────────────────────────────────────────
  { path: '/login',            Component: Login },
  { path: '/recuperar-senha',  Component: RecuperarSenha },
  { path: '/redefinir-senha',  Component: RedefinirSenha },

  // ── Backoffice (só admin) ────────────────────────────────────────────────
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },

  // ── Layout principal ─────────────────────────────────────────────────────
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true,                   Component: Home },
      { path: 'timeline',              Component: Timeline },
      { path: 'modules',               Component: Modules },
      { path: 'resources',             Component: Resources },
      { path: 'forum',                 Component: Forum },
      { path: 'explorar',              Component: Explorar },
      { path: 'perguntas-frequentes',  Component: PerguntasFrequentes },
      {
        path: 'profile',
        element: <ProtectedRoute><Profile /></ProtectedRoute>,
      },
      {
        path: 'notifications',
        element: <ProtectedRoute><Notifications /></ProtectedRoute>,
      },
    ],
  },
])
