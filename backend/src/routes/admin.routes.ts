import { Router } from 'express'
import {
  getDashboardStats,
  listAllUsers, changeUserRole, toggleUserActive,
  listAllConteudos,
  listDenuncias, resolveDenuncia,
  exportUsersCsv, exportActivityCsv,
  listSolicitacoes,
  responderSolicitacaoJindungo,
  responderSolicitacaoTopico,
} from '../controllers/admin.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireAdmin } from '../middlewares/requireRole.js'

export const adminRouter = Router()

// Todas as rotas admin requerem autenticação + papel admin
adminRouter.use(authenticate, requireAdmin)

adminRouter.get   ('/stats',                         getDashboardStats)

adminRouter.get   ('/utilizadores',                  listAllUsers)
adminRouter.patch ('/utilizadores/:id/tipo',         changeUserRole)
adminRouter.patch ('/utilizadores/:id/toggle',       toggleUserActive)

adminRouter.get   ('/conteudos',                     listAllConteudos)

adminRouter.get   ('/denuncias',                     listDenuncias)
adminRouter.patch ('/denuncias/:id',                 resolveDenuncia)

adminRouter.get   ('/solicitacoes',                              listSolicitacoes)
adminRouter.patch ('/solicitacoes/jindungo/:id',                 responderSolicitacaoJindungo)
adminRouter.patch ('/solicitacoes/topico/:id',                   responderSolicitacaoTopico)

adminRouter.get   ('/export/utilizadores-csv',       exportUsersCsv)
adminRouter.get   ('/export/actividade-csv',         exportActivityCsv)
