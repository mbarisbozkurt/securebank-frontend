import type { Account } from '../accounts/accountsApi'
import { apiRequest } from '../../lib/apiClient'

export type FundAccountRequest = {
  amount: number
  description?: string
}

export type AdminDashboardSummary = {
  totalUsers: number
  totalAccounts: number
  totalTransactions: number
  totalSystemBalance: number
  currency: string
}

export type AuditLog = {
  id: number
  action: string
  actorEmail: string
  targetType: string
  targetId: number
  details: string | null
  createdAt: string
}

export function getAdminDashboardSummary() {
  return apiRequest<AdminDashboardSummary>(
    '/api/admin/dashboard',
    {},
    {
      authenticated: true,
      retryOnUnauthorized: true,
    },
  )
}

export function listAuditLogs() {
  return apiRequest<AuditLog[]>(
    '/api/admin/audit-logs',
    {},
    {
      authenticated: true,
      retryOnUnauthorized: true,
    },
  )
}

export function fundAccountByAccountNumber(
  accountNumber: string,
  request: FundAccountRequest,
) {
  return apiRequest<Account>(
    `/api/admin/accounts/by-account-number/${encodeURIComponent(accountNumber)}/fund`,
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
