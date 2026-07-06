import express from 'express'
import cors from 'cors'
import path from 'path'
import { router } from './routes/index.js'
import { notFound } from './middlewares/notFound.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { env } from './config/env.js'
const app = express()

app.use(cors({
  origin: env.isDev ? true : env.corsOrigin,
  credentials: true,
  // Expõe o header Authorization para o cliente
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '2mb' }))

// Rota de saúde rápida (fora do prefixo /api)
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'economia-historia-backend', version: '2.0.0' })
})

app.use('/uploads', express.static(path.resolve('uploads')))
app.use('/api', router)
app.use(notFound)
app.use(errorHandler)

export default app
