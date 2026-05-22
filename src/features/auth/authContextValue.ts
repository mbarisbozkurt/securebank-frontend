import { createContext } from 'react'

import type { AuthSession, AuthUser } from './jwt'

export type AuthContextValue = {
  session: AuthSession | null
  user: AuthUser | null
  isAuthenticated: boolean
  isRestoringSession: boolean
  setSession: (session: AuthSession) => void
  clearSession: () => void
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
