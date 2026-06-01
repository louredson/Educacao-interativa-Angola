import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiRequest, getToken, setToken, removeToken } from '../services/api'

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface User {
  id:          number
  name:        string
  email:       string
  phone?:      string | null
  province?:   string | null
  institution?: string | null
  course?:     string | null
  role:        'visitante' | 'subscrito' | 'admin'
  avatarUrl?:  string | null
  isActive?:   boolean
  createdAt:   string
  lastAccess?: string | null
  isAdmin?:    boolean
}

interface AuthContextType {
  user:            User | null
  token:           string | null
  login:           (email: string, password: string) => Promise<boolean>
  register:        (
    name:        string,
    email:       string,
    password:    string,
    province?:   string,
    institution?: string,
    course?:     string,
    phone?:      string,
  ) => Promise<boolean>
  logout:          () => void
  refreshUser:     () => Promise<void>
  isAuthenticated: boolean
  isAdmin:         boolean
}

// ── Contexto ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USER_KEY = 'currentUser'

function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id:          Number(raw['id']),
    name:        String(raw['name'] ?? ''),
    email:       String(raw['email'] ?? ''),
    phone:       (raw['phone']       as string | null) ?? null,
    province:    (raw['province']    as string | null) ?? null,
    institution: (raw['institution'] as string | null) ?? null,
    course:      (raw['course']      as string | null) ?? null,
    role:        (raw['role'] as User['role']) ?? 'subscrito',
    avatarUrl:   (raw['avatarUrl']   as string | null) ?? null,
    isActive:    Boolean(raw['isActive'] ?? true),
    createdAt:   String(raw['createdAt'] ?? new Date().toISOString()),
    lastAccess:  (raw['lastAccess']  as string | null) ?? null,
    isAdmin:     Boolean(raw['isAdmin'] ?? raw['role'] === 'admin'),
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,  setUser]  = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(getToken)

  // Restaura sessão do localStorage ao montar
  useEffect(() => {
    const savedUser  = localStorage.getItem(USER_KEY)
    const savedToken = getToken()
    if (savedUser && savedToken) {
      try {
        setUser(normalizeUser(JSON.parse(savedUser)))
        setTokenState(savedToken)
      } catch {
        clearSession()
      }
    }
  }, [])

  function clearSession() {
    removeToken()
    localStorage.removeItem(USER_KEY)
    setUser(null)
    setTokenState(null)
  }

  function persistSession(newUser: User, newToken: string) {
    setToken(newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    setUser(newUser)
    setTokenState(newToken)
  }

  // ── Login ────────────────────────────────────────────────────────────────────
  const login: AuthContextType['login'] = async (email, password) => {
    try {
      const response = await apiRequest<{ token: string; user: Record<string, unknown> }>(
        '/auth/login',
        { method: 'POST', json: { email, password }, anonymous: true },
      )
      persistSession(normalizeUser(response.user), response.token)
      return true
    } catch (err) {
      console.error('Erro ao fazer login:', err)
      return false
    }
  }

  // ── Registo ──────────────────────────────────────────────────────────────────
  const register: AuthContextType['register'] = async (
    name, email, password, province, institution, course, phone,
  ) => {
    try {
      const response = await apiRequest<{ token: string; user: Record<string, unknown> }>(
        '/auth/register',
        {
          method: 'POST',
          anonymous: true,
          json: { name, email, password, province, institution, course, telemovel: phone ?? null },
        },
      )
      persistSession(normalizeUser(response.user), response.token)
      return true
    } catch (err) {
      console.error('Erro ao registar:', err)
      return false
    }
  }

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = () => {
    // Notifica o backend (best-effort)
    apiRequest('/auth/logout', { method: 'POST' }).catch(() => null)
    clearSession()
  }

  // ── Refrescar dados do utilizador ─────────────────────────────────────────────
  const refreshUser = async () => {
    try {
      const response = await apiRequest<{ user: Record<string, unknown> }>('/auth/me')
      const updated = normalizeUser(response.user)
      setUser(updated)
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
    } catch {
      // token inválido — o interceptor em api.ts já limpa a sessão
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user && !!token,
        isAdmin:         user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
