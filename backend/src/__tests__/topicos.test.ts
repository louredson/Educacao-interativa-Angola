import { jest } from '@jest/globals'

const mockQuery = jest.fn()

jest.unstable_mockModule('../config/database.js', () => ({
  pool: { query: mockQuery, execute: jest.fn(), getConnection: jest.fn() },
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

describe('GET /api/topicos — acesso público', () => {
  beforeEach(() => mockQuery.mockReset())

  it('devolve lista de tópicos sem autenticação', async () => {
    mockQuery.mockResolvedValueOnce([[
      { id: 1, titulo: 'Tópico 1', descricao: 'Desc', categoria: 'economia', criado_em: new Date() },
    ]])
    const res = await request(app).get('/api/topicos')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('DELETE /api/topicos/:id — sem autenticação', () => {
  it('devolve 401', async () => {
    const res = await request(app).delete('/api/topicos/1')
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/conteudos/:id — sem autenticação', () => {
  it('devolve 401', async () => {
    const res = await request(app).delete('/api/conteudos/abc123')
    expect(res.status).toBe(401)
  })
})
