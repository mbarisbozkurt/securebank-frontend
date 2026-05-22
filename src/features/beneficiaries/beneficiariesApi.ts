import { apiRequest } from '../../lib/apiClient'

export type Beneficiary = {
  id: number
  accountNumber: string
  iban: string
  recipientName: string
  nickname: string | null
  currency: string
  createdAt: string
}

export type CreateBeneficiaryRequest = {
  iban?: string
  accountNumber?: string
  nickname?: string
}

export function listBeneficiaries() {
  return apiRequest<Beneficiary[]>(
    '/api/beneficiaries',
    {},
    {
      authenticated: true,
      retryOnUnauthorized: true,
    },
  )
}

export function createBeneficiary(request: CreateBeneficiaryRequest) {
  return apiRequest<Beneficiary>(
    '/api/beneficiaries',
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

export function updateBeneficiary(
  beneficiaryId: number,
  request: { nickname: string | null },
) {
  return apiRequest<Beneficiary>(
    `/api/beneficiaries/${beneficiaryId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(request),
    },
    {
      authenticated: true,
      retryOnUnauthorized: true,
    },
  )
}

export function deleteBeneficiary(beneficiaryId: number) {
  return apiRequest<void>(
    `/api/beneficiaries/${beneficiaryId}`,
    {
      method: 'DELETE',
    },
    {
      authenticated: true,
      retryOnUnauthorized: true,
    },
  )
}
