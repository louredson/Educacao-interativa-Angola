import { Router } from 'express'
import {
  getDashboardStats,
  getRelatorio,
  listAllUsers, changeUserRole, toggleUserActive, toggleQuizPermissao,
  listAllConteudos,
  listDenuncias, resolveDenuncia,
  listDenunciasConteudo, resolveDenunciaConteudo,
  listarComentariosDenunciados, resolverComentarioDenunciado,
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
adminRouter.get   ('/relatorio',                     getRelatorio)

adminRouter.get   ('/utilizadores',                  listAllUsers)
adminRouter.patch ('/utilizadores/:id/tipo',         changeUserRole)
adminRouter.patch ('/utilizadores/:id/toggle',       toggleUserActive)
adminRouter.patch ('/utilizadores/:id/quiz-permissao', toggleQuizPermissao)

adminRouter.get   ('/conteudos',                     listAllConteudos)

adminRouter.get   ('/denuncias',                     listDenuncias)
adminRouter.patch ('/denuncias/:id',                 resolveDenuncia)

adminRouter.get   ('/denuncias-conteudo',             listDenunciasConteudo)
adminRouter.patch ('/denuncias-conteudo/:id',         resolveDenunciaConteudo)

adminRouter.get   ('/comentarios-denunciados',        listarComentariosDenunciados)
adminRouter.patch ('/comentarios-denunciados/:id',    resolverComentarioDenunciado)

adminRouter.get   ('/solicitacoes',                              listSolicitacoes)
adminRouter.patch ('/solicitacoes/jindungo/:id',                 responderSolicitacaoJindungo)
adminRouter.patch ('/solicitacoes/topico/:id',                   responderSolicitacaoTopico)

adminRouter.get   ('/export/utilizadores-csv',       exportUsersCsv)
adminRouter.get   ('/export/actividade-csv',         exportActivityCsv)
