import crypto from 'node:crypto'
import type { Request } from 'express'
import { env } from '../config/env.js'

export interface AuthTokenPayload {
  sub: string
  email: string
  role: string
  name: string
  iat: number
  exp: number
}

function base64UrlEncode(input: Buffer | string) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return Buffer.from(padded, 'base64').toString('utf8')
}

function parseExpiresIn(expiresIn: string) {
  const match = /^(\d+)([smhd])$/.exec(expiresIn.trim())
  if (!match) {
    return 60 * 60 * 24 * 7
  }

  const value = Number(match[1])
  const unit = match[2]

  switch (unit) {
    case 's':
      return value
    case 'm':
      return value * 60
    case 'h':
      return value * 60 * 60
    case 'd':
      return value * 60 * 60 * 24
    default:
      return 60 * 60 * 24 * 7
  }
}

export function signJwt(
  payload: Omit<AuthTokenPayload, 'iat' | 'exp'>,
  secret: string = env.jwtSecret,
  expiresIn: string = env.jwtExpiresIn,
) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + parseExpiresIn(expiresIn)
  const tokenPayload: AuthTokenPayload = {
    ...payload,
    iat,
    exp,
  }

  const headerPart = base64UrlEncode(JSON.stringify(header))
  const payloadPart = base64UrlEncode(JSON.stringify(tokenPayload))
  const data = `${headerPart}.${payloadPart}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  return `${data}.${signature}`
}

export function verifyJwt(token: string, secret: string = env.jwtSecret) {
  const [headerPart, payloadPart, signaturePart] = token.split('.')
  if (!headerPart || !payloadPart || !signaturePart) {
    throw new Error('Token JWT inválido')
  }

  const data = `${headerPart}.${payloadPart}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  const provided = Buffer.from(signaturePart)
  const expected = Buffer.from(expectedSignature)

  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    throw new Error('Token JWT inválido')
  }

  const payload = JSON.parse(base64UrlDecode(payloadPart)) as AuthTokenPayload
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp <= now) {
    throw new Error('Token JWT expirado')
  }

  return payload
}

export function extractBearerToken(req: Request) {
  const authorization = req.header('authorization')
  if (!authorization) {
    return null
  }

  const [scheme, token] = authorization.split(' ')
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}

export function createResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
  return { rawToken, hashedToken }
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
