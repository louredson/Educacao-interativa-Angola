import { Router } from 'express'
import { criarConvite, usarConvite, listarConvites } from '../controllers/convite.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireAuth, requireProfessorOuAdmin } from '../middlewares/requireRole.js'

export const conviteRouter = Router()

// Criar convite — professor ou admin
conviteRouter.post('/', authenticate, requireProfessorOuAdmin, criarConvite)

// Usar um código de convite — qualquer utilizador autenticado
conviteRouter.post('/usar', authenticate, requireAuth, usarConvite)

// Listar os meus convites
conviteRouter.get('/meus', authenticate, requireProfessorOuAdmin, listarConvites)
