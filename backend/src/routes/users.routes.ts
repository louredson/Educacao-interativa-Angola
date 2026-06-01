import { Router } from 'express'
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from '../controllers/user.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireAdmin } from '../middlewares/requireRole.js'

export const usersRouter = Router()

// Todas as rotas de gestão de utilizadores requerem admin
usersRouter.use(authenticate, requireAdmin)

usersRouter.get   ('/',    listUsers)
usersRouter.post  ('/',    createUser)
usersRouter.get   ('/:id', getUser)
usersRouter.put   ('/:id', updateUser)
usersRouter.delete('/:id', deleteUser)
