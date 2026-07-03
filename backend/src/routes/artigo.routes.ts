/**
 * artigo.routes.ts
 * Rotas para o sistema de artigos
 */
import { Router } from 'express'
import {
  listArtigos,
  listArtigosAdmin,
  getArtigoBySlug,
  getArtigoById,
  createArtigo,
  updateArtigo,
  deleteArtigo,
  publicarArtigo,
  arquivarArtigo,
  listAutoresPermitidos,
  addAutorPermitido,
  removeAutorPermitido,
  minhaPermissao,
} from '../controllers/artigo.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireAdmin } from '../middlewares/requireRole.js'

export const artigoRouter = Router()

// ── Rotas públicas ────────────────────────────────────────────────────────────
artigoRouter.get('/',           listArtigos)
artigoRouter.get('/slug/:slug', getArtigoBySlug)
artigoRouter.get('/id/:id',     getArtigoById)

// ── Rotas autenticadas (admin ou autores permitidos) ──────────────────────────
artigoRouter.get   ('/minha-permissao',  authenticate, minhaPermissao)
artigoRouter.get   ('/admin/todos',      authenticate, listArtigosAdmin)
artigoRouter.post  ('/',              authenticate, createArtigo)
artigoRouter.put   ('/:id',           authenticate, updateArtigo)
artigoRouter.delete('/:id',           authenticate, deleteArtigo)
artigoRouter.patch ('/:id/publicar',  authenticate, publicarArtigo)
artigoRouter.patch ('/:id/arquivar',  authenticate, arquivarArtigo)

// ── Gestão de autores permitidos (só admin) ───────────────────────────────────
artigoRouter.get   ('/admin/autores-permitidos',       authenticate, requireAdmin, listAutoresPermitidos)
artigoRouter.post  ('/admin/autores-permitidos',       authenticate, requireAdmin, addAutorPermitido)
artigoRouter.delete('/admin/autores-permitidos/:id',   authenticate, requireAdmin, removeAutorPermitido)
