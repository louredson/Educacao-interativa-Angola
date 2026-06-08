import { Router } from 'express'
import {
  createTopico,
  deleteTopico,
  getTopicoById,
  listTopicos,
  updateTopico,
  solicitarAcessoTopico,
} from '../controllers/topico.controller.js'
import { denunciarTopico } from '../controllers/forum.controller.js'
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

// Solicitar acesso a tópico privado — utilizador autenticado
topicoRouter.post('/:id/solicitar-acesso', authenticate, requireAuth, solicitarAcessoTopico)

// Denunciar tópico — utilizador autenticado
topicoRouter.post('/:id/denunciar', authenticate, requireAuth, denunciarTopico)
