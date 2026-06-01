import { Router } from 'express'
import {
  createTopico,
  deleteTopico,
  getTopicoById,
  listTopicos,
  updateTopico,
} from '../controllers/topico.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireAuth, requireAdmin } from '../middlewares/requireRole.js'

export const topicoRouter = Router()

// Leitura — pública
topicoRouter.get('/',    listTopicos)
topicoRouter.get('/:id', getTopicoById)

// Criar tópico — utilizador autenticado
topicoRouter.post('/',    authenticate, requireAuth, createTopico)

// Editar/Apagar — apenas admin
topicoRouter.put   ('/:id', authenticate, requireAdmin, updateTopico)
topicoRouter.delete('/:id', authenticate, requireAdmin, deleteTopico)
