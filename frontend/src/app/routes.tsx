import { createBrowserRouter } from 'react-router'
import Home               from './pages/Home'
import Login              from './pages/Login'
import Timeline           from './pages/Timeline'
import Modules            from './pages/Modules'
import Resources          from './pages/Resources'
import Forum              from './pages/Forum'
import Profile            from './pages/Profile'
import AdminDashboard     from './pages/AdminDashboard'
import AdminQuizzes       from './pages/AdminQuizzes'
import Explorar           from './pages/Explorar'
import Notifications      from './pages/Notifications'
import PerguntasFrequentes from './pages/perguntasFrequentes'
import RecuperarSenha     from './pages/RecuperarSenha'
import RedefinirSenha     from './pages/RedefinirSenha'
import EntrarConvite      from './pages/EntrarConvite'
import SalasDiscussao     from './pages/SalasDiscussao'
import Layout             from './components/Layout'
import ProtectedRoute     from './components/ProtectedRoute'

export const router = createBrowserRouter([
  // ── Rotas sem Layout (navbar própria ou sem navbar) ─────────────────────
  { path: '/login',            Component: Login },
  { path: '/recuperar-senha',  Component: RecuperarSenha },
  { path: '/redefinir-senha',  Component: RedefinirSenha },
  { path: '/entrar-convite',   Component: EntrarConvite },
  {
    path: '/admin/quizzes',
    element: <ProtectedRoute requireAdmin allowQuizCreator><AdminQuizzes /></ProtectedRoute>,
  },

  // ── Layout principal (com navbar) ────────────────────────────────────────
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
      { path: 'explorar/:id',          Component: Explorar },
      { path: 'perguntas-frequentes',  Component: PerguntasFrequentes },
      { path: 'salas',                 Component: SalasDiscussao },
      {
        path: 'profile',
        element: <ProtectedRoute><Profile /></ProtectedRoute>,
      },
      {
        path: 'notifications',
        element: <ProtectedRoute><Notifications /></ProtectedRoute>,
      },

      // ── Backoffice (só admin) ─────────────────────────────────────────────
      {
        path: 'admin',
        element: <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>,
      },
    ],
  },
])
