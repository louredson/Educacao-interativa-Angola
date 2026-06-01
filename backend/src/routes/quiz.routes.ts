import { Router } from 'express'
import {
  listQuizzes, getQuiz, createQuiz, updateQuiz, deleteQuiz,
  addPergunta, deletePergunta,
  submitAttempt, quizRanking, quizStats,
} from '../controllers/quiz.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireAdmin, requireAuth } from '../middlewares/requireRole.js'

export const quizRouter = Router()

quizRouter.get ('/',                   authenticate, listQuizzes)
quizRouter.get ('/:id',               authenticate, getQuiz)
quizRouter.post('/',                   authenticate, requireAdmin, createQuiz)
quizRouter.put ('/:id',               authenticate, requireAdmin, updateQuiz)
quizRouter.delete('/:id',             authenticate, requireAdmin, deleteQuiz)

// Perguntas
quizRouter.post  ('/:id/perguntas',               authenticate, requireAdmin, addPergunta)
quizRouter.delete('/:id/perguntas/:perguntaId',   authenticate, requireAdmin, deletePergunta)

// Tentativas
quizRouter.post('/:id/attempt',   authenticate, requireAuth, submitAttempt)
quizRouter.get ('/:id/ranking',   authenticate, quizRanking)
quizRouter.get ('/:id/stats',     authenticate, requireAdmin, quizStats)
