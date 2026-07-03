import { Router } from 'express'
import {
  createTopico,
  deleteTopico,
  getTopicoById,
  listTopicos,
  updateTopico,
  solicitarAcessoTopico,
  cancelarAcessoTopico,
  listarPedidosAcesso,
  responderPedidoAcesso,
  votarTopico,
  fecharTopico,
  fixarTopico,
  resolverTopico,
} from '../controllers/topico.controller.js'
import { denunciarTopico } from '../controllers/forum.controller.js'
import { authenticate, authenticateOptional } from '../middlewares/authenticate.js'
import { requireAuth, requireAdmin } from '../middlewares/requireRole.js'

export const topicoRouter = Router()

// Leitura — pública, mas auth opcional para devolver o voto do utilizador
topicoRouter.get('/',    authenticateOptional, listTopicos)
topicoRouter.get('/:id', authenticateOptional, getTopicoById)

// Criar tópico — utilizador autenticado
topicoRouter.post('/',    authenticate, requireAuth, createTopico)

// Votação ↑/↓ — utilizador autenticado
topicoRouter.post('/:id/votar', authenticate, requireAuth, votarTopico)

// Marcar/limpar solução aceite — autor do tópico ou admin (verificado no controller)
topicoRouter.post('/:id/resolver', authenticate, requireAuth, resolverTopico)

// Fechar/reabrir — criador ou admin (verificado no controller)
topicoRouter.post('/:id/fechar', authenticate, requireAuth, fecharTopico)

// Fixar/desafixar — apenas admin
topicoRouter.post('/:id/fixar', authenticate, requireAdmin, fixarTopico)

// Editar e Apagar — autor do tópico ou admin (verificado no controller)
topicoRouter.put   ('/:id', authenticate, requireAuth, updateTopico)
topicoRouter.delete('/:id', authenticate, requireAuth, deleteTopico)

// Solicitar acesso a tópico privado — utilizador autenticado
topicoRouter.post  ('/:id/solicitar-acesso',             authenticate, requireAuth, solicitarAcessoTopico)
topicoRouter.delete('/:id/solicitar-acesso',             authenticate, requireAuth, cancelarAcessoTopico)
// Gerir pedidos de acesso — apenas o criador do tópico
topicoRouter.get  ('/:id/pedidos-acesso',                authenticate, requireAuth, listarPedidosAcesso)
topicoRouter.patch('/:id/pedidos-acesso/:pedidoId',      authenticate, requireAuth, responderPedidoAcesso)

// Denunciar tópico — utilizador autenticado
topicoRouter.post('/:id/denunciar', authenticate, requireAuth, denunciarTopico)
