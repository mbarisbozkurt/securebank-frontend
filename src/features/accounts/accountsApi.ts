import { apiRequest } from '../../lib/apiClient'

export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED'

export type Account = {
  id: number
  accountNumber: string
  iban: string
  balance: number
  currency: string
  status: AccountStatus
  createdAt: string
}

export type RecipientPreview = {
  accountNumber: string
  iban: string
  recipientName: string
  currency: string
  status: AccountStatus
}

export function listMyAccounts() {
  return apiRequest<Account[]>(
    '/api/accounts/me',
    {},
    {
      authenticated: true,
      retryOnUnauthorized: true,
    },
  )
}

export function createAccount() {
  return apiRequest<Account>(
    '/api/accounts',
    {
      method: 'POST',
    },
    {
      authenticated: true,
      retryOnUnauthorized: true,
    },
  )
}

export function resolveRecipientByAccountNumber(accountNumber: string) {
  const searchParams = new URLSearchParams({ accountNumber })

  return apiRequest<RecipientPreview>(
    `/api/accounts/resolve?${searchParams.toString()}`,
    {},
    {
      authenticated: true,
      retryOnUnauthorized: true,
    },
  )
}

export function resolveRecipientByIban(iban: string) {
  const searchParams = new URLSearchParams({ iban })

  return apiRequest<RecipientPreview>(
    `/api/accounts/resolve?${searchParams.toString()}`,
    {},
    {
      authenticated: true,
      retryOnUnauthorized: true,
    },
  )
}
