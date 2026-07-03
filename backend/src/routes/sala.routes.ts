import { Router } from 'express'
import {
  listSalas,
  createSala,
  getSala,
  deleteSala,
  getMensagens,
  postMensagem,
  getMembros,
  updateMembro,
  solicitarAcesso,
} from '../controllers/sala.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireProfessorOuAdmin, requireAuth } from '../middlewares/requireRole.js'
import { uploadForum } from '../middlewares/upload.js'

export const salaRouter = Router()

// Listar salas do utilizador
salaRouter.get('/', authenticate, requireAuth, listSalas)

// Criar sala — apenas professor, admin, superadmin
salaRouter.post('/', authenticate, requireProfessorOuAdmin, createSala)

// Detalhe de sala
salaRouter.get('/:id', authenticate, requireAuth, getSala)

// Apagar sala — criador ou admin (verificado no controller)
salaRouter.delete('/:id', authenticate, requireAuth, deleteSala)

// Mensagens
salaRouter.get('/:id/mensagens', authenticate, requireAuth, getMensagens)
salaRouter.post('/:id/mensagens', authenticate, requireAuth, uploadForum, postMensagem)

// Gestão de membros — apenas criador (verificado no controller)
salaRouter.get('/:id/membros', authenticate, requireAuth, getMembros)
salaRouter.patch('/:id/membros/:userId', authenticate, requireProfessorOuAdmin, updateMembro)

// Solicitar acesso
salaRouter.post('/:id/solicitar-acesso', authenticate, requireAuth, solicitarAcesso)
