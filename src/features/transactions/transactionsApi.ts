import { apiRequest } from '../../lib/apiClient'

export type TransactionType = 'TRANSFER'
export type TransactionStatus = 'COMPLETED' | 'FAILED'

export type Transaction = {
  id: number
  fromAccountId: number
  fromAccountNumber: string
  fromAccountHolderName: string
  toAccountId: number
  toAccountNumber: string
  toAccountHolderName: string
  amount: number
  currency: string
  type: TransactionType
  status: TransactionStatus
  description: string | null
  createdAt: string
}

export function listMyTransactions() {
  return apiRequest<Transaction[]>(
    '/api/transactions/me',
    {},
    {
      authenticated: true,
      retryOnUnauthorized: true,
    },
  )
}
