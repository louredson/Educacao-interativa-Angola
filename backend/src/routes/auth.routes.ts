// routes/auth.routes.ts
import { Router } from 'express'
import { register, login, logout, me, forgotPassword, resetPassword } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { forgotPasswordLimiter, resetPasswordLimiter } from '../middlewares/rateLimit.js'

export const authRouter = Router()

authRouter.post('/register',         register)
authRouter.post('/login',            login)
authRouter.post('/logout',           authenticate, logout)
authRouter.get ('/me',               authenticate, me)
authRouter.post('/forgot-password',  forgotPasswordLimiter, forgotPassword)
authRouter.post('/reset-password',   resetPasswordLimiter,  resetPassword)

