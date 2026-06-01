import { Router } from 'express'
import {
  createConteudo,
  deleteConteudo,
  getConteudoById,
  listConteudos,
  updateConteudo,
} from '../controllers/conteudo.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireAdmin } from '../middlewares/requireRole.js'

export const conteudoRouter = Router()

// Leitura — pública
conteudoRouter.get('/',    listConteudos)
conteudoRouter.get('/:id', getConteudoById)

// Escrita — apenas admins (em produção podes alargar a 'subscrito' se quiseres)
conteudoRouter.post  ('/',    authenticate, requireAdmin, createConteudo)
conteudoRouter.put   ('/:id', authenticate, requireAdmin, updateConteudo)
conteudoRouter.delete('/:id', authenticate, requireAdmin, deleteConteudo)
