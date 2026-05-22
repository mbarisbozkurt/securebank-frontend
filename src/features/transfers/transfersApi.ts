import { apiRequest } from '../../lib/apiClient'
import type { Transaction } from '../transactions/transactionsApi'

export type TransferRequest = {
  fromAccountId: number
  toAccountNumber?: string
  toIban?: string
  amount: number
  description?: string
}

export function createTransfer(request: TransferRequest) {
  return apiRequest<Transaction>(
    '/api/transfers',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
    {
      authenticated: true,
      retryOnUnauthorized: true,
    },
  )
}
