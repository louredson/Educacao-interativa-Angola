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
  role:        'visitante' | 'subscrito' | 'professor' | 'admin' | 'superadmin'
  avatarUrl?:  string | null
  isActive?:   boolean
  createdAt:   string
  lastAccess?: string | null
  isAdmin?:    boolean
  pode_criar_quiz?: boolean
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
  isAuthenticated:      boolean
  isAdmin:              boolean
  isProfessor:          boolean
  isProfessorOuAdmin:   boolean
  /** true enquanto a sessão guardada está a ser restaurada ao montar */
  loading:              boolean
}

// ── Contexto ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USER_KEY = 'currentUser'

function normalizeUser(raw: Record<string, unknown>): User {
  // A API devolve as chaves em português (nome, tipo, provincia…); aceitamos
  // também as variantes em inglês para compatibilidade.
  const rawRole = String(raw['role'] ?? raw['tipo'] ?? 'subscrito')
  const role = rawRole as User['role']
  const ehAdmin = rawRole === 'admin' || rawRole === 'superadmin' || Boolean(raw['isAdmin'])
  return {
    id:          Number(raw['id']),
    name:        String(raw['name'] ?? raw['nome'] ?? ''),
    email:       String(raw['email'] ?? ''),
    phone:       (raw['phone'] ?? raw['telemovel'] ?? null) as string | null,
    province:    (raw['province'] ?? raw['provincia'] ?? null) as string | null,
    institution: (raw['institution'] ?? raw['instituicao'] ?? null) as string | null,
    course:      (raw['course'] ?? raw['curso'] ?? null) as string | null,
    role,
    avatarUrl:   (raw['avatarUrl'] ?? raw['avatar_url'] ?? null) as string | null,
    isActive:    Boolean(raw['isActive'] ?? raw['ativo'] ?? true),
    createdAt:   String(raw['createdAt'] ?? raw['criado_em'] ?? new Date().toISOString()),
    lastAccess:  (raw['lastAccess'] ?? raw['ultimo_acesso'] ?? null) as string | null,
    isAdmin:     ehAdmin,
    pode_criar_quiz: Boolean(raw['pode_criar_quiz']),
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,  setUser]  = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(getToken)
  const [loading, setLoading] = useState(true)

  // Restaura sessão do localStorage ao montar (instantâneo), depois confirma
  // com o servidor em segundo plano — sem isto, alterações feitas noutro
  // dispositivo/sessão (ex: foto de perfil trocada na app mobile) só
  // apareciam na web depois de um logout/login manual, porque o utilizador
  // ficava preso no valor antigo guardado em localStorage.
  useEffect(() => {
    const savedUser  = localStorage.getItem(USER_KEY)
    const savedToken = getToken()
    if (savedUser && savedToken) {
      try {
        setUser(normalizeUser(JSON.parse(savedUser)))
        setTokenState(savedToken)
      } catch {
        clearSession()
        setLoading(false)
        return
      }
      // Reconciliação silenciosa com o servidor — não bloqueia a UI.
      apiRequest<{ user: Record<string, unknown> }>('/auth/me')
        .then((response) => {
          const fresh = normalizeUser(response.user)
          setUser(fresh)
          localStorage.setItem(USER_KEY, JSON.stringify(fresh))
        })
        .catch(() => {
          // token inválido — o interceptor em api.ts já limpa a sessão;
          // qualquer outro erro (rede) simplesmente mantém o valor em cache.
        })
    }
    setLoading(false)
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
        isAuthenticated:    !!user && !!token,
        isAdmin:            !!user?.isAdmin,
        isProfessor:        user?.role === 'professor',
        isProfessorOuAdmin: user?.role === 'professor' || !!user?.isAdmin,
        loading,
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
