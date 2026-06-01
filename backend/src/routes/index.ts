import { Router } from 'express'
import { authRouter } from './auth.routes.js'
import { healthRouter } from './health.routes.js'
import { conteudoRouter } from './conteudo.routes.js'
import { usersRouter } from './users.routes.js'
import { topicoRouter } from './topico.routes.js'
import { notificacaoRouter } from './notificacao.routes.js'

export const router = Router()

router.get('/', (_req, res) => {
  res.json({
    ok: true,
  routes: ['/api/health', '/api/conteudos', '/api/topicos'],
  })
})

router.use('/health', healthRouter)
router.use('/auth', authRouter)
router.use('/users', usersRouter)
router.use('/conteudos', conteudoRouter)
router.use('/topicos', topicoRouter)
router.use('/notificacoes', notificacaoRouter)
