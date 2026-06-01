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
  if (response.status === 401) {
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
