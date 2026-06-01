import { Router } from 'express'
import {
  listNotificacoes, marcarLida, marcarTodasLidas, deleteNotificacao,
} from '../controllers/notification.controller.js'
import {
  getMyProfile, getPublicProfile, updateMyProfile,
} from '../controllers/profile.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireAuth } from '../middlewares/requireRole.js'

export const notificacaoRouter = Router()

notificacaoRouter.get   ('/',             authenticate, requireAuth, listNotificacoes)
notificacaoRouter.patch ('/ler-todas',    authenticate, requireAuth, marcarTodasLidas)
notificacaoRouter.patch ('/:id/ler',      authenticate, requireAuth, marcarLida)
notificacaoRouter.delete('/:id',          authenticate, requireAuth, deleteNotificacao)

// ── Perfil ────────────────────────────────────────────────────────────────────
export const perfilRouter = Router()

perfilRouter.get('/',     authenticate, requireAuth, getMyProfile)
perfilRouter.put('/',     authenticate, requireAuth, updateMyProfile)
perfilRouter.get('/:id',  authenticate, getPublicProfile)
