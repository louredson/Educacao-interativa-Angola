import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Alert } from 'react-native'
import {
  getStoredUser,
  getToken,
  removeToken,
  setStoredUser,
  setToken,
  setUnauthorizedHandler,
} from '../services/api'
import * as authService from '../services/authService'
import { mensagemAmigavel } from '../components/EstadoErro'

export interface User {
  id: number
  name: string
  email: string
  province?: string | null
  institution?: string | null
  course?: string | null
  role: 'visitante' | 'subscrito' | 'professor' | 'admin' | 'superadmin'
  isAdmin: boolean
  isProfessorOuAdmin: boolean
  avatarUrl?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (dados: authService.DadosRegisto) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ ok: boolean; message: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function normalizeUser(raw: Record<string, unknown>): User {
  const rawRole = String(raw['role'] ?? raw['tipo'] ?? 'subscrito')
  const ehAdmin = rawRole === 'admin' || rawRole === 'superadmin'
  return {
    id: Number(raw['id']),
    name: String(raw['name'] ?? raw['nome'] ?? ''),
    email: String(raw['email'] ?? ''),
    province: (raw['province'] ?? raw['provincia'] ?? null) as string | null,
    institution: (raw['institution'] ?? raw['instituicao'] ?? null) as string | null,
    course: (raw['course'] ?? raw['curso'] ?? null) as string | null,
    role: rawRole as User['role'],
    isAdmin: ehAdmin,
    isProfessorOuAdmin: rawRole === 'professor' || ehAdmin,
    avatarUrl: (raw['avatarUrl'] ?? raw['avatar_url'] ?? null) as string | null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const token = await getToken()
        const saved = await getStoredUser<Record<string, unknown>>()
        if (token && saved) {
          setUser(normalizeUser(saved))
          // Reconciliação silenciosa com o servidor — sem isto, alterações
          // feitas noutra sessão/dispositivo (ex: foto de perfil trocada na
          // web) só apareciam aqui depois de um logout/login manual.
          authService
            .me()
            .then((res) => {
              const fresh = normalizeUser(res.user)
              setUser(fresh)
              void setStoredUser(fresh)
            })
            .catch(() => {
              /* token inválido — o unauthorizedHandler já trata a sessão; erro de rede mantém o cache */
            })
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Regista-se junto do cliente HTTP para ser avisado sempre que um pedido
  // autenticado devolver 401 (token inválido/expirado). Sem isto, o token
  // era limpo do AsyncStorage mas o `user` continuava em memória — a app
  // mostrava-se "com sessão iniciada" enquanto todos os pedidos seguintes
  // falhavam silenciosamente. Só avisa o utilizador se ele estava mesmo
  // autenticado (evita alertas para visitantes em rotas que exigem login).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser((prev) => {
        if (prev) {
          Alert.alert('Sessão expirada', 'Inicia sessão novamente para continuares.')
        }
        return null
      })
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  async function persist(rawUser: Record<string, unknown>, token: string) {
    const normalized = normalizeUser(rawUser)
    await setToken(token)
    await setStoredUser(normalized)
    setUser(normalized)
  }

  const login: AuthContextType['login'] = async (email, password) => {
    try {
      const res = await authService.login(email, password)
      await persist(res.user, res.token)
      return true
    } catch {
      return false
    }
  }

  const register: AuthContextType['register'] = async (dados) => {
    try {
      const res = await authService.register(dados)
      await persist(res.user, res.token)
      return true
    } catch {
      return false
    }
  }

  const forgotPassword: AuthContextType['forgotPassword'] = async (email) => {
    try {
      const res = await authService.forgotPassword(email)
      return { ok: true, message: res.message }
    } catch (e) {
      return { ok: false, message: mensagemAmigavel(e) }
    }
  }

  const logout: AuthContextType['logout'] = async () => {
    authService.logout().catch(() => null)
    await removeToken()
    setUser(null)
  }

  const refreshUser: AuthContextType['refreshUser'] = async () => {
    try {
      const res = await authService.me()
      const normalized = normalizeUser(res.user)
      await setStoredUser(normalized)
      setUser(normalized)
    } catch {
      /* token inválido — interceptor já limpou */
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
