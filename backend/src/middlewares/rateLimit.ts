/**
 * Middleware de rate limiting simples em memória.
 * Limita o número de pedidos por IP num janela de tempo.
 * Adequado para endpoints sensíveis (forgot-password, reset-password).
 *
 * Para produção com múltiplas instâncias, substituir por rate-limiter-flexible + Redis.
 */

import type { Request, Response, NextFunction } from 'express'

interface RateLimitEntry {
  count:     number
  resetAt:   number
}

const store = new Map<string, RateLimitEntry>()

/**
 * Cria um middleware de rate limiting.
 *
 * @param maxRequests  Número máximo de pedidos permitidos na janela
 * @param windowMs     Duração da janela em milissegundos
 * @param message      Mensagem de erro a devolver ao cliente
 */
export function createRateLimiter(
  maxRequests: number,
  windowMs:    number,
  message      = 'Demasiados pedidos. Por favor, aguarda alguns minutos e tenta novamente.',
) {
  // Limpeza periódica de entradas expiradas (evita memory leak)
  const cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) store.delete(key)
    }
  }, windowMs * 2)

  // Evita que o interval impeça o processo de terminar
  cleanupInterval.unref?.()

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    // Usa X-Forwarded-For (quando atrás de proxy/nginx) com fallback para remoteAddress
    const ip  = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
             ?? req.socket?.remoteAddress
             ?? 'unknown'
    const now = Date.now()

    const entry = store.get(ip)

    if (!entry || entry.resetAt <= now) {
      // Nova janela
      store.set(ip, { count: 1, resetAt: now + windowMs })
      return next()
    }

    if (entry.count < maxRequests) {
      entry.count++
      return next()
    }

    // Limite atingido
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000)
    res.setHeader('Retry-After', String(retryAfterSec))
    return res.status(429).json({ message })
  }
}

/**
 * Rate limiter pré-configurado para recuperação de senha:
 * máximo de 5 pedidos por IP em 15 minutos.
 */
export const forgotPasswordLimiter = createRateLimiter(
  5,
  15 * 60 * 1000,
  'Demasiados pedidos de recuperação de senha. Aguarda 15 minutos e tenta novamente.',
)

/**
 * Rate limiter pré-configurado para redefinição de senha:
 * máximo de 10 tentativas por IP em 15 minutos.
 */
export const resetPasswordLimiter = createRateLimiter(
  10,
  15 * 60 * 1000,
  'Demasiadas tentativas de redefinição. Aguarda 15 minutos e tenta novamente.',
)
