import 'dotenv/config'
import { createServer } from 'node:http'
import app from './app.js'
import { env } from './config/env.js'
import { testDatabaseConnection } from './config/database.js'

// Testa a ligação à BD antes de servir pedidos
testDatabaseConnection()
  .then(() => console.log('✅  Base de dados ligada'))
  .catch((err) => {
    console.error('❌  Falha ao ligar à base de dados:', err)
    process.exit(1)
  })

const server = createServer(app)

server.listen(env.port, () => {
  console.log(`Backend running on http://localhost:${env.port}`)
})
