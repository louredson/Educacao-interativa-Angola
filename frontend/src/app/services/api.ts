import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

// ── Chave de armazenamento do token ──────────────────────────────────────────
const TOKEN_KEY = 'authToken'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// ── Opções do pedido ──────────────────────────────────────────────────────────
type ApiOptions = RequestInit & {
  json?: unknown
  /** Se true, não injeta o header Authorization mesmo que exista token */
  anonymous?: boolean
}

// ── Função principal ──────────────────────────────────────────────────────────
export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)

  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  // Injeta o JWT automaticamente se existir e não for pedido anónimo
  if (!options.anonymous) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  })

  // Token expirado — limpa a sessão local
  // Excepção: endpoints que usam 401 para indicar dados errados (não sessão expirada)
  const skipLogout = path.includes('/change-password') || path.includes('/forgot-password')
  if (response.status === 401 && !skipLogout) {
    removeToken()
    localStorage.removeItem('currentUser')
    // Redireciona para login se não estiver já lá
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
  }

  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message?: string }).message ?? 'Request failed')
        : 'Request failed'
    throw new Error(message)
  }

  return data as T
}

export function getApiBase() {
  return API_BASE
}

// Resolve um caminho relativo devolvido pelo backend (ex: "/uploads/avatars/1-xxx.jpg")
// para um URL absoluto que aponta para o backend, independentemente da origem
// onde o frontend está a correr. URLs já absolutos (http/https) e data-URLs
// passam inalterados.
export function resolveUploadUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path
  return `${API_BASE.replace(/\/api\/?$/, '')}${path}`
}

// ── Cliente axios (default export) ────────────────────────────────────────────
// Usado pela tela Explorar e componentes. Partilha o mesmo token ('authToken')
// e base URL do cliente fetch acima, para manter a sessão coerente.
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      removeToken()
      localStorage.removeItem('currentUser')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
