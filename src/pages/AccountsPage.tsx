import { CreditCard, Plus, RefreshCw, WalletCards } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from 'react'

import {
  createAccount,
  listMyAccounts,
  type Account,
} from '../features/accounts/accountsApi'
import { Spinner } from '../components/Spinner'
import { useToast } from '../components/toastContext'
import { withMinDelay } from '../lib/minDelay'

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { showToast } = useToast()

  const loadAccounts = useCallback(async () => {
    setErrorMessage('')
    setIsLoading(true)

    try {
      const response = await listMyAccounts()
      setAccounts(response)
    } catch {
      setErrorMessage('Accounts could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAccounts()
  }, [loadAccounts])

  const totalBalance = useMemo(
    () =>
      accounts.reduce((total, account) => {
        if (account.status !== 'ACTIVE') {
          return total
        }

        return total + Number(account.balance)
      }, 0),
    [accounts],
  )

  async function handleCreateAccount() {
    setErrorMessage('')
    setIsCreating(true)

    try {
      const account = await withMinDelay(createAccount())
      setAccounts((currentAccounts) => [account, ...currentAccounts])
      showToast('Account opened.')
    } catch {
      setErrorMessage('Account could not be opened.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="page-frame">
      <div className="page-heading-row">
        <div className="page-heading">
          <p className="eyebrow">Accounts</p>
          <h1>My accounts</h1>
        </div>

        <button
          className="primary-button page-action"
          type="button"
          onClick={handleCreateAccount}
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Spinner />
              Opening...
            </>
          ) : (
            <>
              <Plus size={17} aria-hidden />
              Open account
            </>
          )}
        </button>
      </div>

      <div className="account-summary-strip">
        <SummaryCard
          icon={WalletCards}
          label="Total balance"
          value={formatMoney(totalBalance, 'TRY')}
        />
        <SummaryCard
          icon={CreditCard}
          label="Accounts"
          value={String(accounts.length)}
        />
      </div>

      {errorMessage ? (
        <section className="inline-error" role="alert">
          <p>{errorMessage}</p>
          <button className="text-button" type="button" onClick={loadAccounts}>
            <RefreshCw size={15} aria-hidden />
            Try again
          </button>
        </section>
      ) : null}

      {isLoading ? (
        <section className="accounts-grid" aria-label="Loading accounts">
          <AccountSkeleton />
          <AccountSkeleton />
        </section>
      ) : accounts.length === 0 ? (
        <section className="panel accounts-empty">
          <span className="empty-icon">
            <CreditCard size={22} aria-hidden />
          </span>
          <div>
            <h2>No accounts yet</h2>
            <p className="muted-text">
              Open your first SecureBank account to start tracking balances and
              money movement.
            </p>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={handleCreateAccount}
          disabled={isCreating}
        >
            {isCreating ? (
              <>
                <Spinner />
                Opening...
              </>
            ) : (
              <>
                <Plus size={17} aria-hidden />
                Open account
              </>
            )}
          </button>
        </section>
      ) : (
        <section className="accounts-grid" aria-label="Your accounts">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </section>
      )}
    </div>
  )
}

type SummaryCardProps = {
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  label: string
  value: string
}

function SummaryCard({ icon: Icon, label, value }: SummaryCardProps) {
  return (
    <article className="metric-card compact-metric">
      <Icon size={19} aria-hidden />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function AccountCard({ account }: { account: Account }) {
  return (
    <article className="account-card">
      <div className="account-card-top">
        <span className="soft-icon">
          <CreditCard size={19} aria-hidden />
        </span>
        <span className={`status-badge status-${account.status.toLowerCase()}`}>
          {formatStatus(account.status)}
        </span>
      </div>

      <div>
        <p className="eyebrow">Account number</p>
        <h2>{account.accountNumber}</h2>
        <p className="account-iban">{formatIban(account.iban)}</p>
      </div>

      <div className="account-card-bottom">
        <div>
          <span>Balance</span>
          <strong>{formatMoney(account.balance, account.currency)}</strong>
        </div>
        <div>
          <span>Opened</span>
          <strong>{formatDate(account.createdAt)}</strong>
        </div>
      </div>
    </article>
  )
}

function AccountSkeleton() {
  return (
    <article className="account-card account-card-skeleton" aria-hidden>
      <span />
      <span />
      <span />
    </article>
  )
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatIban(value: string) {
  return value.replace(/(.{4})/g, '$1 ').trim()
}

function formatStatus(status: Account['status']) {
  const labels: Record<Account['status'], string> = {
    ACTIVE: 'Active',
    FROZEN: 'Frozen',
    CLOSED: 'Closed',
  }

  return labels[status]
}
