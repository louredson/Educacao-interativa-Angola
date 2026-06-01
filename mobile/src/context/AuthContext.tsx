import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '../types/api'
import {
  login as loginRequest,
  me as meRequest,
  register as registerRequest,
  requestPasswordReset as requestPasswordResetRequest,
  resetPassword as resetPasswordRequest,
  type LoginPayload,
  type RegisterPayload,
} from '../services/auth'
import { clearSession, getStoredToken, getStoredUser, saveSession } from '../services/storage'
import { buildDemoAuthResponse } from '../mocks/data'
import { demoModeEnabled } from '../constants/mode'
import { isDemoModeStored, setDemoMode } from '../services/storage'

interface AuthContextValue {
  user: User | null
  token: string | null
  isBootstrapping: boolean
  isAuthenticating: boolean
  authError: string | null
  isAuthenticated: boolean
  signIn: (payload: LoginPayload) => Promise<void>
  signUp: (payload: RegisterPayload) => Promise<void>
  signInDemo: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ message: string; resetToken?: string }>
  resetPassword: (token: string, password: string) => Promise<{ message: string }>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      try {
        const storedDemoMode = await isDemoModeStored()
        const storedToken = await getStoredToken()
        const storedUser = await getStoredUser()
        if (!mounted) return

        if (demoModeEnabled || storedDemoMode) {
          const demoAuth = buildDemoAuthResponse(storedUser?.name, storedUser?.email)
          setToken(demoAuth.accessToken)
          setUser(demoAuth.user)
          await saveSession(demoAuth.accessToken, demoAuth.user)
          await setDemoMode(true)
          return
        }

        if (storedToken) {
          setToken(storedToken)
        }

        if (storedUser) {
          setUser(storedUser)
        }

        if (storedToken) {
          const freshUser = await meRequest()
          if (!mounted) return
          setUser(freshUser)
        }
      } catch {
        if (!mounted) return
        await clearSession()
        setToken(null)
        setUser(null)
      } finally {
        if (mounted) {
          setIsBootstrapping(false)
        }
      }
    }

    void bootstrap()

    return () => {
      mounted = false
    }
  }, [])

  const persistAuth = async (nextToken: string, nextUser: User) => {
    setToken(nextToken)
    setUser(nextUser)
    await saveSession(nextToken, nextUser)
  }

  const signIn = async (payload: LoginPayload) => {
    setIsAuthenticating(true)
    setAuthError(null)
    try {
      const response = await loginRequest(payload)
      await persistAuth(response.accessToken, response.user)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível iniciar sessão')
      throw error
    } finally {
      setIsAuthenticating(false)
    }
  }

  const signUp = async (payload: RegisterPayload) => {
    setIsAuthenticating(true)
    setAuthError(null)
    try {
      const response = await registerRequest(payload)
      await persistAuth(response.accessToken, response.user)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível registar a conta')
      throw error
    } finally {
      setIsAuthenticating(false)
    }
  }

  const signInDemo = async () => {
    setIsAuthenticating(true)
    setAuthError(null)
    try {
      const demoAuth = buildDemoAuthResponse()
      await setDemoMode(true)
      await persistAuth(demoAuth.accessToken, demoAuth.user)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const signOut = async () => {
    setUser(null)
    setToken(null)
    setAuthError(null)
    await setDemoMode(false)
    await clearSession()
  }

  const refreshProfile = async () => {
    const freshUser = await meRequest()
    setUser(freshUser)
    if (token) {
      await saveSession(token, freshUser)
    }
  }

  const requestPasswordReset = async (email: string) => {
    return requestPasswordResetRequest(email)
  }

  const resetPassword = async (resetToken: string, password: string) => {
    return resetPasswordRequest(resetToken, password)
  }

  const clearError = () => setAuthError(null)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isBootstrapping,
      isAuthenticating,
      authError,
      isAuthenticated: Boolean(user && token),
      signIn,
      signUp,
      signInDemo,
      signOut,
      refreshProfile,
      requestPasswordReset,
      resetPassword,
      clearError,
    }),
    [user, token, isBootstrapping, isAuthenticating, authError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}



