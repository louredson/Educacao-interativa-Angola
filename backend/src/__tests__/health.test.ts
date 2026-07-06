import { jest } from '@jest/globals'

// Mocks antes de qualquer import dinâmico (necessário com ESM)
jest.unstable_mockModule('../config/database.js', () => ({
  pool: { query: jest.fn(), execute: jest.fn(), getConnection: jest.fn() },
  testDatabaseConnection: jest.fn().mockResolvedValue(undefined),
}))
jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test' }),
    }),
  },
}))

const { default: request } = await import('supertest')
const { default: app }     = await import('../app.js')

describe('GET /health', () => {
  it('devolve 200 com ok:true', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.service).toBe('economia-historia-backend')
  })
})

describe('GET /api', () => {
  it('devolve versão da API', async () => {
    const res = await request(app).get('/api')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})
