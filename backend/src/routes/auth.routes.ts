// routes/auth.routes.ts
import { Router } from 'express'
import { register, login, logout, me, forgotPassword, resetPassword } from '../controllers/auth.controller.js'
import { authenticate, authenticateAllowInactive } from '../middlewares/authenticate.js'
import { forgotPasswordLimiter, resetPasswordLimiter } from '../middlewares/rateLimit.js'

export const authRouter = Router()

authRouter.post('/register',         register)
authRouter.post('/login',            login)
// logout e /me aceitam contas suspensas: o utilizador banido precisa de ler
// o próprio estado (para a tela "Conta suspensa") e de terminar a sessão.
authRouter.post('/logout',           authenticateAllowInactive, logout)
authRouter.get ('/me',               authenticateAllowInactive, me)
authRouter.post('/forgot-password',  forgotPasswordLimiter, forgotPassword)
authRouter.post('/reset-password',   resetPasswordLimiter,  resetPassword)

