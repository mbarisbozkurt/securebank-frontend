export type UserRole = 'USER' | 'ADMIN'

export type JwtPayload = {
  sub: string
  role: UserRole
  iat: number
  exp: number
}

export type AuthSession = {
  accessToken: string
}

export type AuthUser = {
  email: string
  role: UserRole
  expiresAt: number
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const payload = token.split('.')[1]

  if (!payload) {
    return null
  }

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '=',
    )
    const decodedPayload = window.atob(paddedPayload)
    const parsedPayload = JSON.parse(decodedPayload) as JwtPayload

    if (!parsedPayload.sub || !isKnownRole(parsedPayload.role) || !parsedPayload.exp) {
      return null
    }

    return parsedPayload
  } catch {
    return null
  }
}

export function getUserFromSession(session: AuthSession): AuthUser | null {
  const payload = decodeJwtPayload(session.accessToken)

  if (!payload) {
    return null
  }

  return {
    email: payload.sub,
    role: payload.role,
    expiresAt: payload.exp * 1000,
  }
}

function isKnownRole(role: string): role is UserRole {
  return role === 'USER' || role === 'ADMIN'
}
