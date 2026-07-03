/**
 * types/index.ts
 *
 * Alteração em relação à versão anterior:
 *  - UserType passa a incluir 'superadmin' (após migration_quiz_ownership.sql)
 *  - JwtPayload.role tipado com UserType em vez de string genérico
 *
 * O campo role no JWT já é preenchido com user.tipo no auth.controller.ts
 * (linha: signToken({ userId, email, role: user.tipo })), portanto nenhuma
 * alteração é necessária no auth.controller ou no authenticate middleware.
 */
import type { RowDataPacket } from 'mysql2'
import type { JwtPayload }    from '../config/jwt.js'

// Estende o Request do Express para incluir o utilizador autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

// 'professor' adicionado — requer 005_papel_professor.sql aplicada
export type UserType = 'visitante' | 'subscrito' | 'professor' | 'admin' | 'superadmin'

// Estende RowDataPacket — obrigatório para usar como genérico em pool.query<UserRecord[]>
export interface UserRecord extends RowDataPacket {
  id:           number
  nome:         string
  email:        string
  senha_hash:   string
  telemovel:    string | null
  provincia:    string | null
  instituicao:  string | null
  curso:        string | null
  tipo:         UserType
  avatar_url:   string | null
  ativo:        0 | 1
  criado_em:    string
  ultimo_acesso: string | null
}

// ── PublicUser — versão segura do UserRecord (sem senha_hash) ────────────────
export interface PublicUser {
  id:           number
  nome:         string
  email:        string
  telemovel:    string | null
  provincia:    string | null
  instituicao:  string | null
  curso:        string | null
  tipo:         UserType
  avatar_url:   string | null
  ativo:        0 | 1
  criado_em:    string
  ultimo_acesso: string | null
}

// Remove campos sensíveis e devolve um objecto seguro para enviar ao cliente
export function toPublicUser(user: UserRecord): PublicUser {
  const {
    senha_hash: _senha,
    ...publicFields
  } = user as UserRecord & { senha_hash: string }
  return publicFields as unknown as PublicUser
}
