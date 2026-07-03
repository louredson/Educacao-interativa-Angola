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
import { requireAdmin, requireAuth, requireProfessorOuAdmin } from '../middlewares/requireRole.js'

export const conteudoRouter = Router()

// Leitura — pública
conteudoRouter.get('/',    listConteudos)
conteudoRouter.get('/:id', getConteudoById)

// Escrita — professores e admins
conteudoRouter.post  ('/',    authenticate, requireProfessorOuAdmin, createConteudo)
conteudoRouter.put   ('/:id', authenticate, requireProfessorOuAdmin, updateConteudo)
conteudoRouter.delete('/:id', authenticate, requireProfessorOuAdmin, deleteConteudo)

// Solicitar acesso a texto com Jindungo — utilizador autenticado
conteudoRouter.post('/:id/solicitar-acesso', authenticate, solicitarAcessoJindungo)
