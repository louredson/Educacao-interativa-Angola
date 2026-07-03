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
const bcrypt               = await import('bcryptjs')

describe('POST /api/auth/login', () => {
  beforeEach(() => mockQuery.mockReset())

  it('rejeita quando faltam campos obrigatórios', async () => {
    const res = await request(app).post('/api/auth/login').send({})
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/obrigatórios/)
  })

  it('rejeita credenciais inválidas — utilizador não existe', async () => {
    mockQuery.mockResolvedValueOnce([[]])
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inexistente@exemplo.com', password: 'qualquer123' })
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Credenciais inválidas.')
  })

  it('devolve token para credenciais válidas', async () => {
    const hash = await bcrypt.hash('senha123', 10)
    mockQuery
      .mockResolvedValueOnce([[{
        id: 1, nome: 'Teste', email: 'teste@exemplo.com',
        senha_hash: hash, tipo: 'subscrito', ativo: 1,
        telemovel: null, provincia: 'Luanda', instituicao: null,
        curso: null, criado_em: new Date().toISOString(), ultimo_acesso: null,
      }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teste@exemplo.com', password: 'senha123' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.email).toBe('teste@exemplo.com')
  })
})

describe('POST /api/auth/register', () => {
  beforeEach(() => mockQuery.mockReset())

  it('rejeita quando faltam campos obrigatórios', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Só nome' })
    expect(res.status).toBe(400)
  })

  it('rejeita password curta (< 8 caracteres)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Teste', email: 'teste@exemplo.com', password: '123' })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/8 caracteres/)
  })

  it('rejeita email já registado', async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 99 }]])
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Teste', email: 'existente@exemplo.com', password: 'senha1234' })
    expect(res.status).toBe(409)
    expect(res.body.message).toBe('Email já registado.')
  })
})

describe('GET /api/auth/me — sem token', () => {
  it('devolve 401', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})
