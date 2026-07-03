/**
 * enquete.routes.ts
 *
 * Montado em: /api/topicos  (ver routes/index.ts)
 * Prefix final: /api/topicos/:id/enquete
 *
 * Para adicionar ao index.ts:
 *   import { enqueteRouter } from './enquete.routes.js'
 *   router.use('/topicos', enqueteRouter)
 *
 * NOTA: o topicoRouter já usa /api/topicos — este router usa mergeParams
 * para aceder ao :id do tópico pai.
 */
import { Router } from 'express'
import {
  criarEnquete,
  getEnquete,
  votarEnquete,
  encerrarEnquete,
  apagarEnquete,
} from '../controllers/enquete.controller.js'
import { authenticate, authenticateOptional } from '../middlewares/authenticate.js'
import { requireAuth } from '../middlewares/requireRole.js'

export const enqueteRouter = Router({ mergeParams: true })

// Ver enquete + resultados (visitantes vêem em tópicos públicos)
enqueteRouter.get   ('/:id/enquete',          authenticateOptional, getEnquete)

// Criar enquete — só dono do tópico (verificado no controller)
enqueteRouter.post  ('/:id/enquete',          authenticate, requireAuth, criarEnquete)

// Votar
enqueteRouter.post  ('/:id/enquete/votar',    authenticate, requireAuth, votarEnquete)

// Encerrar e apagar — dono do tópico ou admin (verificado no controller)
enqueteRouter.patch ('/:id/enquete/encerrar', authenticate, requireAuth, encerrarEnquete)
enqueteRouter.delete('/:id/enquete',          authenticate, requireAuth, apagarEnquete)
