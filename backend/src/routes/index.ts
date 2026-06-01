import { Router } from 'express'
import { authRouter }        from './auth.routes.js'
import { quizRouter }        from './quiz.routes.js'
import { forumRouter }       from './forum.routes.js'
import { progressRouter }    from './progress.routes.js'
import { notificacaoRouter, perfilRouter } from './notification.routes.js'
import { adminRouter }       from './admin.routes.js'

// Mantém as rotas originais do projecto
import { conteudoRouter }    from './conteudo.routes.js'
import { usersRouter }       from './users.routes.js'
import { topicoRouter }      from './topico.routes.js'
import { healthRouter }      from './health.routes.js'

export const router = Router()

router.get('/', (_req, res) => {
  res.json({ ok: true, version: '2.0.0', routes: [
    '/api/auth', '/api/conteudos', '/api/quizzes',
    '/api/topicos', '/api/notificacoes', '/api/perfil',
    '/api/ranking', '/api/admin',
  ]})
})

// Infra
router.use('/health',       healthRouter)

// Autenticação (registo, login, recuperação de senha)
router.use('/auth',         authRouter)

// Conteúdos e tópicos (mantém compatibilidade com o frontend existente)
router.use('/conteudos',    conteudoRouter)
router.use('/topicos',      topicoRouter)

// Quiz
router.use('/quizzes',      quizRouter)

// Fórum e comentários (rotas montadas directamente no forumRouter com prefixo /api)
router.use('/',             forumRouter)

// Progresso, favoritos, conquistas, ranking
router.use('/',             progressRouter)

// Notificações
router.use('/notificacoes', notificacaoRouter)

// Perfil
router.use('/perfil',       perfilRouter)

// Gestão de utilizadores (admin only — rota herdada)
router.use('/users',        usersRouter)

// Backoffice admin
router.use('/admin',        adminRouter)
