import {
  Landmark,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { Spinner } from '../components/Spinner'
import { useToast } from '../components/toastContext'
import {
  fundAccountByAccountNumber,
  getAdminDashboardSummary,
  type AdminDashboardSummary,
} from '../features/admin/adminApi'
import type { Account } from '../features/accounts/accountsApi'
import { ApiClientError } from '../lib/apiClient'
import { withMinDelay } from '../lib/minDelay'

export function AdminDashboardPage() {
  const [accountNumber, setAccountNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('Demo account funding')
  const [fundedAccount, setFundedAccount] = useState<Account | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [summaryErrorMessage, setSummaryErrorMessage] = useState('')
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null)
  const [isSummaryLoading, setIsSummaryLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReviewingFunding, setIsReviewingFunding] = useState(false)
  const { showToast } = useToast()

  const loadSummary = useCallback(async () => {
    setSummaryErrorMessage('')
    setIsSummaryLoading(true)

    try {
      const response = await getAdminDashboardSummary()
      setSummary(response)
    } catch {
      setSummaryErrorMessage('Admin summary could not be loaded.')
    } finally {
      setIsSummaryLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setFundedAccount(null)

    if (!validateFundingInput()) {
      return
    }

    setIsReviewingFunding(true)
  }

  async function handleConfirmFunding() {
    setErrorMessage('')
    setFundedAccount(null)

    if (!validateFundingInput()) {
      setIsReviewingFunding(false)
      return
    }

    setIsSubmitting(true)

    try {
      const normalizedAccountNumber = normalizeAccountNumber(accountNumber)
      const response = await withMinDelay(
        fundAccountByAccountNumber(normalizedAccountNumber, {
          amount: Number(amount),
          description: description.trim() || undefined,
        }),
      )
      setFundedAccount(response)
      setAmount('')
      setIsReviewingFunding(false)
      showToast('Account funded.')
      void loadSummary()
    } catch (error) {
      setErrorMessage(getFundingErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  function validateFundingInput() {
    const normalizedAccountNumber = normalizeAccountNumber(accountNumber)
    const parsedAmount = Number(amount)

    if (!accountNumber || !amount) {
      setErrorMessage('Enter a SecureBank account number and amount.')
      return false
    }

    if (!/^SB\d{12}$/.test(normalizedAccountNumber)) {
      setErrorMessage('Enter a valid SecureBank account number, such as SB123456789012.')
      return false
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0.01) {
      setErrorMessage('Funding amount must be at least 0.01.')
      return false
    }

    return true
  }

  function editFundingDetails() {
    setErrorMessage('')
    setIsReviewingFunding(false)
  }

  return (
    <div className="page-frame">
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Operations dashboard</h1>
      </div>

      <div className="admin-grid">
        <section className="balance-panel admin-hero" aria-label="Admin overview">
          <div className="balance-panel-top">
            <span className="soft-icon">
              <ShieldCheck size={20} aria-hidden />
            </span>
          </div>
          <p className="eyebrow">Demo funding</p>
          <strong className="balance-value">Fund accounts safely</strong>
          <p className="muted-text">
            Add demo balance to customer accounts so transfers can be tested without
            changing the normal user account-opening flow.
          </p>
        </section>

        <section className="panel admin-funding-panel">
          <div className="panel-title-row">
            <h2>Fund account</h2>
            <span className="status-badge status-active">Admin only</span>
          </div>

          <form className="form-grid" onSubmit={handleSubmit} noValidate>
            <label>
              SecureBank account number
              <input
                type="text"
                autoCapitalize="characters"
                inputMode="text"
                maxLength={14}
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value.toUpperCase())}
                disabled={isReviewingFunding || isSubmitting}
                required
              />
            </label>
            <label>
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={isReviewingFunding || isSubmitting}
                required
              />
            </label>
            <label>
              Description
              <input
                type="text"
                maxLength={255}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={isReviewingFunding || isSubmitting}
              />
            </label>

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            {isReviewingFunding ? (
              <div className="transfer-review admin-funding-review">
                <h3>Review funding</h3>
                <dl className="review-list">
                  <div>
                    <dt>Account number</dt>
                    <dd>{normalizeAccountNumber(accountNumber)}</dd>
                  </div>
                  <div>
                    <dt>Amount</dt>
                    <dd>{formatMoney(Number(amount), 'TRY')}</dd>
                  </div>
                  <div>
                    <dt>Description</dt>
                    <dd>{description.trim() || 'No description'}</dd>
                  </div>
                </dl>
                <div className="form-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={editFundingDetails}
                    disabled={isSubmitting}
                  >
                    Edit details
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={handleConfirmFunding}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner />
                        Funding...
                      </>
                    ) : (
                      <>
                        <WalletCards size={17} aria-hidden />
                        Confirm funding
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button className="primary-button" type="submit" disabled={isSubmitting}>
                <WalletCards size={17} aria-hidden />
                Review funding
              </button>
            )}
          </form>
        </section>
      </div>

      {summaryErrorMessage ? (
        <section className="inline-error" role="alert">
          <p>{summaryErrorMessage}</p>
          <button className="text-button" type="button" onClick={loadSummary}>
            <RefreshCw size={15} aria-hidden />
            Try again
          </button>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-title-row">
          <h2>System summary</h2>
          <span className="status-badge status-active">Live</span>
        </div>
        {isSummaryLoading ? (
          <div className="skeleton-list" aria-label="Loading admin summary">
            <span />
            <span />
            <span />
          </div>
        ) : summary ? (
          <div className="admin-summary-grid">
            <AdminMetricCard
              icon={Users}
              label="Users"
              value={formatInteger(summary.totalUsers)}
            />
            <AdminMetricCard
              icon={WalletCards}
              label="Accounts"
              value={formatInteger(summary.totalAccounts)}
            />
            <AdminMetricCard
              icon={ReceiptText}
              label="Transactions"
              value={formatInteger(summary.totalTransactions)}
            />
            <AdminMetricCard
              icon={Landmark}
              label="System balance"
              value={formatMoney(summary.totalSystemBalance, summary.currency)}
            />
          </div>
        ) : null}
      </section>

      {fundedAccount ? (
        <section className="panel funded-result">
          <span className="empty-icon">
            <Landmark size={21} aria-hidden />
          </span>
          <div>
            <p className="eyebrow">Funding complete</p>
            <h2>{fundedAccount.accountNumber}</h2>
            <p className="muted-text">
              New balance: {formatMoney(fundedAccount.balance, fundedAccount.currency)}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function AdminMetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <article className="metric-card compact-metric">
      <Icon size={20} aria-hidden />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function getFundingErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.details.validationErrors) {
      return Object.values(error.details.validationErrors).join(' ')
    }

    if (error.status === 404) {
      return 'Account could not be found.'
    }

    if (error.status === 403) {
      return 'This action requires admin access.'
    }
  }

  return 'Account could not be funded.'
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function normalizeAccountNumber(value: string) {
  return value.trim().replace(/\s+/g, '').toUpperCase()
}
