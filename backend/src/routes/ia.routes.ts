/**
 * ia.routes.ts
 * Rotas para os endpoints de Inteligência Artificial (Groq)
 */
import { Router } from 'express'
import { iaAssist, iaGerarArtigo } from '../controllers/ia.controller.js'
import { authenticate } from '../middlewares/authenticate.js'

export const iaRouter = Router()

// Apenas utilizadores autenticados podem usar a IA
// (evita abuso do limite gratuito por visitantes anónimos)
iaRouter.post('/assist', authenticate, iaAssist)
iaRouter.post('/gerar',  authenticate, iaGerarArtigo)
