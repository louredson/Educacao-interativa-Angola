import type { RowDataPacket } from 'mysql2'
import type { JwtPayload } from '../config/jwt.js'

// Estende o Request do Express para incluir o utilizador autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export type UserType = 'visitante' | 'subscrito' | 'admin'

// Estende RowDataPacket — obrigatório para usar como genérico em pool.query<UserRecord[]>
export interface UserRecord extends RowDataPacket {
  id:                 number
  nome:               string
  email:              string
  senha_hash:         string
  telemovel:          string | null
  provincia:          string | null
  instituicao:        string | null
  curso:              string | null
  tipo:               UserType
  avatar_url:         string | null
  ativo:              0 | 1
  criado_em:          string
  ultimo_acesso:      string | null
}

export interface PublicUser {
  id:          number
  name:        string
  email:       string
  phone:       string | null
  province:    string | null
  institution: string | null
  course:      string | null
  role:        UserType
  avatarUrl:   string | null
  isActive:    boolean
  createdAt:   string
  lastAccess:  string | null
  isAdmin:     boolean
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id:          user.id,
    name:        user.nome,
    email:       user.email,
    phone:       user.telemovel,
    province:    user.provincia,
    institution: user.instituicao,
    course:      user.curso,
    role:        user.tipo,
    avatarUrl:   user.avatar_url,
    isActive:    Boolean(user.ativo),
    createdAt:   user.criado_em,
    lastAccess:  user.ultimo_acesso,
    isAdmin:     user.tipo === 'admin',
  }
}
