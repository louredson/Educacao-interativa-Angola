import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

const API_PORT = 5000
const DEFAULT_TIMEOUT_MS = 15000

// Resolve a base da API:
//  1) EXPO_PUBLIC_API_URL, se definido (.env)
//  2) Em desenvolvimento, o IP da máquina onde o Metro corre (do dispositivo/emulador
//     o backend não está em "localhost"); usa esse IP com a porta do backend.
//  3) Fallback para localhost.
function resolveApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL

  const hostUri =
    Constants.expoConfig?.hostUri ??
    // compatibilidade com versões antigas do Expo
    (Constants as any).manifest?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost

  const host = hostUri ? String(hostUri).split(':')[0] : 'localhost'
  return `http://${host}:${API_PORT}/api`
}

const API_BASE = resolveApiBase()

const TOKEN_KEY = 'authToken'
const USER_KEY = 'currentUser'

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY)
}
export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token)
}
export async function removeToken(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY])
}

export async function getStoredUser<T = unknown>(): Promise<T | null> {
  const raw = await AsyncStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as T) : null
}
export async function setStoredUser(user: unknown): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
}

// ── Sessão expirada ────────────────────────────────────────────────────────
// O AuthContext regista aqui um callback para ser avisado quando um pedido
// autenticado leva 401 (token inválido/expirado), para limpar o `user` em
// memória e não deixar a UI a mostrar-se "autenticada" com um token morto.
type UnauthorizedHandler = () => void
let unauthorizedHandler: UnauthorizedHandler | null = null
export function setUnauthorizedHandler(fn: UnauthorizedHandler | null): void {
  unauthorizedHandler = fn
}

// ── Erros classificados ───────────────────────────────────────────────────
// Permite aos ecrãs distinguir "sem internet" / "demorou demasiado" de um
// erro genuíno do servidor, e mostrar mensagens amigáveis + retry, em vez de
// tratar tudo como "lista vazia".
export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'unknown'

export class ApiError extends Error {
  status?: number
  kind: ApiErrorKind
  constructor(message: string, opts: { status?: number; kind: ApiErrorKind }) {
    super(message)
    this.name = 'ApiError'
    this.status = opts.status
    this.kind = opts.kind
  }
}

type ApiOptions = Omit<RequestInit, 'body'> & {
  json?: unknown
  /** Para uploads multipart (ex: foto de perfil). Não definir Content-Type manualmente —
   *  o fetch/RN define automaticamente o boundary correto. */
  formData?: FormData
  /** Se true, não injeta o header Authorization mesmo que exista token */
  anonymous?: boolean
  /** Tempo máximo de espera pelo pedido, em ms (default 15s, 60s para uploads) */
  timeoutMs?: number
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers as HeadersInit | undefined)

  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (!options.anonymous) {
    const token = await getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const controller = new AbortController()
  const timeoutDefault = options.formData ? 60000 : DEFAULT_TIMEOUT_MS
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? timeoutDefault)

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
      body: options.formData ?? (options.json !== undefined ? JSON.stringify(options.json) : undefined),
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if ((err as Error)?.name === 'AbortError') {
      throw new ApiError('O pedido demorou demasiado tempo. Verifica a tua ligação e tenta novamente.', {
        kind: 'timeout',
      })
    }
    // Regista o erro real (não mostrado ao utilizador) para facilitar diagnóstico —
    // "sem ligação à internet" é só a melhor aproximação para o utilizador, mas o
    // motivo real pode ser outro (ex: erro a construir o pedido).
    if (__DEV__) console.warn(`[apiRequest] falha em ${path}:`, err)
    throw new ApiError('Sem ligação à internet. Verifica a tua rede e tenta novamente.', { kind: 'network' })
  }
  clearTimeout(timeoutId)

  // Excepção: endpoints que usam 401 para indicar dados errados (não sessão expirada)
  const skipUnauthorized = path.includes('/change-password') || path.includes('/forgot-password')
  if (response.status === 401 && !skipUnauthorized) {
    await removeToken()
    if (!options.anonymous) unauthorizedHandler?.()
  }

  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message?: string }).message ?? 'Pedido falhou.')
        : 'Pedido falhou.'
    throw new ApiError(message, { status: response.status, kind: 'http' })
  }

  return data as T
}

export function getApiBase(): string {
  return API_BASE
}

// Resolve um caminho relativo devolvido pelo backend (ex: "/uploads/avatars/1-xxx.jpg")
// para um URL absoluto que aponta para o backend — necessário porque o mobile
// corre numa origem diferente do servidor. URLs já absolutos passam inalterados.
export function resolveUploadUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path
  return `${API_BASE.replace(/\/api\/?$/, '')}${path}`
}

// Compatibilidade com a base inicial
export async function getHealth() {
  return apiRequest('/stats', { anonymous: true })
}
