import { Router } from 'express'
import { forgotPassword, login, me, register, resetPassword } from '../controllers/auth.controller.js'

export const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.get('/me', me)
authRouter.post('/forgot-password', forgotPassword)
authRouter.post('/reset-password', resetPassword)
