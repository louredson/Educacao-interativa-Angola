import { Router } from 'express'
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../controllers/notificacao.controller.js'

export const notificacaoRouter = Router()

notificacaoRouter.get('/', listNotifications)
notificacaoRouter.patch('/ler-todas', markAllNotificationsAsRead)
notificacaoRouter.patch('/:id/lida', markNotificationAsRead)
