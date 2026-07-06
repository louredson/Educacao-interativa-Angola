// Mock the MySQL pool before any module imports it
import { jest } from '@jest/globals'

// Mock da base de dados — impede ligações reais em testes
jest.mock('../config/database.js', () => ({
  pool: {
    query: jest.fn(),
    execute: jest.fn(),
    getConnection: jest.fn(),
  },
  testDatabaseConnection: jest.fn().mockResolvedValue(undefined),
}))

// Mock do nodemailer para não enviar emails reais
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}))
