import { apiRequest } from '../../lib/apiClient'

export type AccessTokenResponse = {
  token: string
  tokenType: 'Bearer'
  expiresIn: number
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  fullName: string
  email: string
  password: string
}

export async function login(request: LoginRequest) {
  return apiRequest<AccessTokenResponse>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
    { includeCredentials: true },
  )
}

export async function register(request: RegisterRequest) {
  return apiRequest<string | Record<string, unknown>>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function refreshSession() {
  return apiRequest<AccessTokenResponse>(
    '/api/auth/refresh',
    {
      method: 'POST',
    },
    { includeCredentials: true },
  )
}

export async function logoutSession() {
  return apiRequest<void>(
    '/api/auth/logout',
    {
      method: 'POST',
    },
    { includeCredentials: true },
  )
}
