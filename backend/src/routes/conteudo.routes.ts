import { Router } from 'express'
import {
  createConteudo,
  deleteConteudo,
  getConteudoById,
  listConteudos,
  updateConteudo,
  solicitarAcessoJindungo,
} from '../controllers/conteudo.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireAdmin, requireAuth } from '../middlewares/requireRole.js'

export const conteudoRouter = Router()

// Leitura — pública
conteudoRouter.get('/',    listConteudos)
conteudoRouter.get('/:id', getConteudoById)

// Escrita — apenas admins (em produção podes alargar a 'subscrito' se quiseres)
conteudoRouter.post  ('/',    authenticate, requireAdmin, createConteudo)
conteudoRouter.put   ('/:id', authenticate, requireAdmin, updateConteudo)
conteudoRouter.delete('/:id', authenticate, requireAdmin, deleteConteudo)

// Solicitar acesso a texto com Jindungo — utilizador autenticado
conteudoRouter.post('/:id/solicitar-acesso', authenticate, solicitarAcessoJindungo)
