import { Router } from 'express'
import {
  listRespostas, createResposta, deleteResposta,
  likeResposta, denunciarResposta, votarResposta,
} from '../controllers/forum.controller.js'
import {
  listComentarios, createComentario, deleteComentario, likeComentario,
} from '../controllers/comentario.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireAuth } from '../middlewares/requireRole.js'
import { uploadForum } from '../middlewares/upload.js'

export const forumRouter = Router()

// Respostas de tópicos do fórum
forumRouter.get   ('/topicos/:id/respostas',     authenticate, requireAuth, listRespostas)
forumRouter.post  ('/topicos/:id/respostas',     authenticate, requireAuth, uploadForum, createResposta)
forumRouter.delete('/respostas/:id',             authenticate, requireAuth, deleteResposta)
forumRouter.post  ('/respostas/:id/like',        authenticate, requireAuth, likeResposta)
forumRouter.post  ('/respostas/:id/votar',       authenticate, requireAuth, votarResposta)
forumRouter.post  ('/respostas/:id/denunciar',   authenticate, requireAuth, denunciarResposta)

// Comentários de conteúdos
forumRouter.get   ('/conteudos/:id/comentarios', authenticate, requireAuth, listComentarios)
forumRouter.post  ('/conteudos/:id/comentarios', authenticate, requireAuth, createComentario)
forumRouter.delete('/comentarios/:id',           authenticate, requireAuth, deleteComentario)
forumRouter.post  ('/comentarios/:id/like',      authenticate, requireAuth, likeComentario)
