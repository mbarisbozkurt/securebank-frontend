import { API_BASE_URL } from '../config/api'

type AccessTokenResponse = {
  token: string
  tokenType: 'Bearer'
  expiresIn: number
}

type ApiAuthHandlers = {
  getAccessToken: () => string | null
  setAccessToken: (token: string) => void
  clearSession: () => void
}

let authHandlers: ApiAuthHandlers | null = null

export type ApiErrorResponse = {
  timestamp?: string
  status: number
  error?: string
  message: string
  path?: string
  validationErrors?: Record<string, string>
}

export class ApiClientError extends Error {
  status: number
  details: ApiErrorResponse

  constructor(details: ApiErrorResponse) {
    super(details.message)
    this.name = 'ApiClientError'
    this.status = details.status
    this.details = details
  }
}

type RequestOptions = {
  token?: string
  authenticated?: boolean
  includeCredentials?: boolean
  retryOnUnauthorized?: boolean
}

export function configureApiAuthHandlers(handlers: ApiAuthHandlers) {
  authHandlers = handlers
}

export async function apiRequest<TResponse>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<TResponse> {
  return sendRequest<TResponse>(path, init, options, false)
}

async function sendRequest<TResponse>(
  path: string,
  init: RequestInit,
  options: RequestOptions,
  hasRetried: boolean,
): Promise<TResponse> {
  const headers = new Headers(init.headers)
  const token =
    options.token ??
    (options.authenticated ? authHandlers?.getAccessToken() ?? undefined : undefined)

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: options.includeCredentials ? 'include' : init.credentials,
    headers,
  })

  if (
    response.status === 401 &&
    options.retryOnUnauthorized &&
    !hasRetried &&
    authHandlers
  ) {
    try {
      const refreshedToken = await refreshAccessToken()
      authHandlers.setAccessToken(refreshedToken)

      return sendRequest<TResponse>(
        path,
        init,
        {
          ...options,
          token: refreshedToken,
        },
        true,
      )
    } catch {
      authHandlers.clearSession()
    }
  }

  if (!response.ok) {
    throw new ApiClientError(await parseErrorResponse(response))
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await parseSuccessResponse(response)) as TResponse
}

async function refreshAccessToken() {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new ApiClientError(await parseErrorResponse(response))
  }

  const body = (await parseSuccessResponse(response)) as AccessTokenResponse

  if (!body.token) {
    throw new ApiClientError({
      status: response.status,
      message: 'Session refresh failed',
    })
  }

  return body.token
}

async function parseSuccessResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('Content-Type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

async function parseErrorResponse(response: Response): Promise<ApiErrorResponse> {
  try {
    const body = (await response.json()) as Partial<ApiErrorResponse>

    return {
      status: body.status ?? response.status,
      error: body.error ?? response.statusText,
      message: body.message ?? 'Request failed',
      timestamp: body.timestamp,
      path: body.path,
      validationErrors: body.validationErrors,
    }
  } catch {
    return {
      status: response.status,
      error: response.statusText,
      message: 'Request failed',
    }
  }
}
