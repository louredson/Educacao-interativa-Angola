import { Router } from 'express'
import { authRouter }        from './auth.routes.js'
import { quizRouter }        from './quiz.routes.js'
import { forumRouter }       from './forum.routes.js'
import { progressRouter }    from './progress.routes.js'
import { notificacaoRouter, perfilRouter } from './notification.routes.js'
import { adminRouter }       from './admin.routes.js'
import { artigoRouter }      from './artigo.routes.js'
import { iaRouter }          from './ia.routes.js'
import { statsRouter }       from './stats.routes.js'
import { contentRouter }     from './content.routes.js'

import { conteudoRouter }    from './conteudo.routes.js'
import { usersRouter }       from './users.routes.js'
import { topicoRouter }      from './topico.routes.js'
import { enqueteRouter }     from './enquete.routes.js'
import { healthRouter }      from './health.routes.js'
import { salaRouter }        from './sala.routes.js'
import { conviteRouter }     from './convite.routes.js'

export const router = Router()

router.get('/', (_req, res) => {
  res.json({ ok: true, version: '2.1.0', routes: [
    '/api/auth', '/api/conteudos', '/api/quizzes',
    '/api/topicos', '/api/notificacoes', '/api/perfil',
    '/api/ranking', '/api/admin', '/api/artigos', '/api/ia', '/api/stats',
    '/api/salas',
  ]})
})

router.use('/health',       healthRouter)
router.use('/stats',        statsRouter)
router.use('/content',      contentRouter)
router.use('/auth',         authRouter)
router.use('/conteudos',    conteudoRouter)
router.use('/topicos',      topicoRouter)
router.use('/topicos',      enqueteRouter)
router.use('/quizzes',      quizRouter)
router.use('/',             forumRouter)
router.use('/',             progressRouter)
router.use('/notificacoes', notificacaoRouter)
router.use('/perfil',       perfilRouter)
router.use('/users',        usersRouter)
router.use('/admin',        adminRouter)
router.use('/artigos',      artigoRouter)
router.use('/ia',           iaRouter)
router.use('/salas',        salaRouter)
router.use('/convites',     conviteRouter)
