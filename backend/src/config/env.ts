/**
 * env.ts
 *
 * Sem novas variáveis de ambiente necessárias para esta implementação:
 *  - GROQ_API_KEY e GROQ_MODEL já existem e são lidas directamente pelo
 *    gemini.service.ts (mesmo padrão do ia.controller.ts existente).
 *  - A extensão de tipos para 'superadmin' é feita em types/index.ts.
 */
import 'dotenv/config'

export const env = {
  port:         Number(process.env.PORT    ?? 5000),
  nodeEnv:      process.env.NODE_ENV       ?? 'development',
  corsOrigin:   process.env.CORS_ORIGIN    ?? 'http://localhost:5173',

  // Base de dados
  dbHost:       process.env.DB_HOST        ?? 'localhost',
  dbPort:       Number(process.env.DB_PORT ?? 3306),
  dbUser:       process.env.DB_USER        ?? 'root',
  dbPassword:   process.env.DB_PASSWORD    ?? '',
  dbName:       process.env.DB_NAME        ?? 'economia_historia',

  // JWT
  jwtSecret:    process.env.JWT_SECRET     ?? 'CHANGE_THIS_SECRET_IN_PRODUCTION',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',

  // Frontend (para links nos emails)
  frontendUrl:  process.env.FRONTEND_URL   ?? 'http://localhost:5173',

  // Email SMTP
  emailHost:    process.env.EMAIL_HOST     ?? 'smtp.gmail.com',
  emailPort:    Number(process.env.EMAIL_PORT ?? 587),
  emailSecure:  process.env.EMAIL_SECURE   === 'true',
  emailUser:    process.env.EMAIL_USER     ?? '',
  emailPass:    process.env.EMAIL_PASS     ?? '',
  emailFrom:    process.env.EMAIL_FROM     ?? 'Economia com História <noreply@economiahistoria.ao>',

  // Helpers
  get isDev()  { return this.nodeEnv === 'development' },
  get isProd() { return this.nodeEnv === 'production'  },
}
