import { Router } from 'express'
import {
  getProgresso,
  marcarLido,
  listFavoritos,
  favoritarConteudo,
  desfavoritarConteudo,
  getConquistas,
  getRanking,
} from '../controllers/progress.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireAuth } from '../middlewares/requireRole.js'

export const progressRouter = Router()

progressRouter.get   ('/progresso',                 authenticate, requireAuth, getProgresso)
progressRouter.post  ('/conteudos/:id/ler',         authenticate, requireAuth, marcarLido)
progressRouter.get   ('/favoritos',                 authenticate, requireAuth, listFavoritos)
progressRouter.post  ('/conteudos/:id/favoritar',   authenticate, requireAuth, favoritarConteudo)
progressRouter.delete('/conteudos/:id/favoritar',   authenticate, requireAuth, desfavoritarConteudo)
progressRouter.get   ('/conquistas',                authenticate, requireAuth, getConquistas)
progressRouter.get   ('/ranking',                   authenticate, getRanking)
