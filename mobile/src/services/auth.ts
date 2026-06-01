import { api } from './api'
import { demoModeEnabled } from '../constants/mode'
import { buildDemoAuthResponse, demoToken, demoUser } from '../mocks/data'
import { isDemoModeStored } from './storage'
import type { AuthResponse, User } from '../types/api'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  province?: string
  telemovel?: string | null
  institution?: string | null
  course?: string | null
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ForgotPasswordResponse {
  message: string
  resetToken?: string
}

export async function login(payload: LoginPayload) {
  if (demoModeEnabled || (await isDemoModeStored())) {
    return buildDemoAuthResponse(undefined, payload.email)
  }

  const { data } = await api.post<AuthResponse>('/auth/login', payload)
  return data
}

export async function register(payload: RegisterPayload) {
  if (demoModeEnabled || (await isDemoModeStored())) {
    return {
      user: {
        ...demoUser,
        name: payload.name,
        email: payload.email,
        phone: payload.telemovel ?? null,
        province: payload.province ?? 'Luanda',
        institution: payload.institution ?? null,
        course: payload.course ?? null,
        lastAccess: new Date().toISOString(),
      },
      accessToken: demoToken,
    }
  }

  const { data } = await api.post<AuthResponse>('/auth/register', payload)
  return data
}

export async function me() {
  if (demoModeEnabled || (await isDemoModeStored())) {
    return demoUser
  }

  const { data } = await api.get<{ user: User }>('/auth/me')
  return data.user
}

export async function requestPasswordReset(email: string) {
  if (demoModeEnabled || (await isDemoModeStored())) {
    return {
      message: `Foi gerado um token de demonstração para ${email}`,
      resetToken: '123456',
    }
  }

  const { data } = await api.post<ForgotPasswordResponse>('/auth/forgot-password', { email })
  return data
}

export async function resetPassword(token: string, password: string) {
  if (demoModeEnabled || (await isDemoModeStored())) {
    return {
      message: 'Palavra-passe atualizada em modo demo.',
    }
  }

  const { data } = await api.post<{ message: string }>('/auth/reset-password', { token, password })
  return data
}

