import { Router } from 'express'
import {
  adicionarPlaylist,
  atualizarComentario,
  atualizarConteudo,
  criarComentario,
  criarConteudo,
  denunciarComentario,
  denunciarConteudo,
  gostarComentario,
  guardarConteudo,
  listarComentarios,
  listarConteudos,
  listarPedidosDoMeuConteudo,
  listarPlaylist,
  obterEstadoUsuario,
  reagirConteudo,
  registrarVisualizacao,
  removerComentario,
  removerConteudo,
  removerPlaylist,
  resolverImagemUrl,
  responderPedidoAcesso,
  solicitarAcessoConteudo,
  uploadConteudoFicheiro,
} from '../controllers/content.controller.js'
import { authenticate, authenticateOptional } from '../middlewares/authenticate.js'
import { requireProfessorOuAdmin, requireProfessor } from '../middlewares/requireRole.js'
import { uploadContent } from '../middlewares/uploadContent.js'

export const contentRouter = Router()

contentRouter.get('/', listarConteudos)
contentRouter.get('/resolve-image', authenticate, requireProfessor, resolverImagemUrl)
contentRouter.post('/upload', authenticate, uploadContent, uploadConteudoFicheiro)
contentRouter.post('/', authenticate, requireProfessor, criarConteudo)
contentRouter.get('/me/state', authenticate, obterEstadoUsuario)
contentRouter.get('/me/playlist', authenticate, listarPlaylist)
contentRouter.post('/me/playlist', authenticate, adicionarPlaylist)
contentRouter.delete('/me/playlist/:contentId/:episodeId', authenticate, removerPlaylist)
// Pedidos de acesso Jindungo — só o criador do conteúdo pode ver e responder
contentRouter.get('/me/access-requests', authenticate, requireProfessorOuAdmin, listarPedidosDoMeuConteudo)
contentRouter.patch('/access-requests/:pedidoId', authenticate, requireProfessorOuAdmin, responderPedidoAcesso)
contentRouter.post('/:id/view', authenticateOptional, registrarVisualizacao)
contentRouter.post('/:id/reaction', authenticate, reagirConteudo)
contentRouter.post('/:id/save', authenticate, guardarConteudo)
contentRouter.post('/:id/report', authenticate, denunciarConteudo)
contentRouter.post('/:id/access-request', authenticate, solicitarAcessoConteudo)
contentRouter.get('/:id/comments', authenticateOptional, listarComentarios)
contentRouter.post('/:id/comments', authenticate, criarComentario)
contentRouter.patch('/comments/:commentId', authenticate, atualizarComentario)
contentRouter.delete('/comments/:commentId', authenticate, removerComentario)
contentRouter.post('/comments/:commentId/like', authenticate, gostarComentario)
contentRouter.post('/comments/:commentId/report', authenticate, denunciarComentario)

// Editar/eliminar conteúdo (autor ou admin) — declaradas no fim para não
// colidir com /me/* nem /comments/*.
contentRouter.put('/:id', authenticate, atualizarConteudo)
contentRouter.delete('/:id', authenticate, removerConteudo)
