import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error('[ERROR]', err)

  // Devolve stack trace apenas em desenvolvimento
  const detail = env.nodeEnv === 'development' && err instanceof Error
    ? err.message
    : undefined

  res.status(500).json({
    message: 'Erro interno do servidor.',
    ...(detail ? { detail } : {}),
  })
}
