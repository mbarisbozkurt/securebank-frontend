import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { configureApiAuthHandlers } from '../../lib/apiClient'
import { logoutSession, refreshSession } from './authApi'
import { AuthContext, type AuthContextValue } from './authContextValue'
import { getUserFromSession, type AuthSession } from './jwt'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, updateSession] = useState<AuthSession | null>(null)
  const [isRestoringSession, setIsRestoringSession] = useState(true)
  const sessionRef = useRef<AuthSession | null>(null)

  const user = useMemo(() => {
    if (!session) {
      return null
    }

    return getUserFromSession(session)
  }, [session])

  const setSession = useCallback((nextSession: AuthSession) => {
    sessionRef.current = nextSession
    updateSession(nextSession)
  }, [])

  const clearSession = useCallback(() => {
    sessionRef.current = null
    updateSession(null)
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutSession()
    } finally {
      clearSession()
    }
  }, [clearSession])

  useEffect(() => {
    let isActive = true

    async function restoreSession() {
      try {
        const response = await refreshSession()

        if (isActive) {
          setSession({ accessToken: response.token })
        }
      } catch {
        if (isActive) {
          clearSession()
        }
      } finally {
        if (isActive) {
          setIsRestoringSession(false)
        }
      }
    }

    void restoreSession()

    return () => {
      isActive = false
    }
  }, [clearSession, setSession])

  useEffect(() => {
    configureApiAuthHandlers({
      getAccessToken: () => sessionRef.current?.accessToken ?? null,
      setAccessToken: (accessToken) => {
        setSession({ accessToken })
      },
      clearSession,
    })
  }, [clearSession, setSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isAuthenticated: Boolean(session && user),
      isRestoringSession,
      setSession,
      clearSession,
      logout,
    }),
    [clearSession, isRestoringSession, logout, session, setSession, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
