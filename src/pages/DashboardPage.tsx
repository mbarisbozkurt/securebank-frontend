import {
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Plus,
  RefreshCw,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { listMyAccounts, type Account } from '../features/accounts/accountsApi'
import {
  listMyTransactions,
  type Transaction,
} from '../features/transactions/transactionsApi'

export function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadAccounts = useCallback(async () => {
    setErrorMessage('')
    setIsLoading(true)

    try {
      const [accountsResponse, transactionsResponse] = await Promise.all([
        listMyAccounts(),
        listMyTransactions(),
      ])
      setAccounts(accountsResponse)
      setTransactions(transactionsResponse)
    } catch {
      setErrorMessage('Dashboard could not be updated.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAccounts()
  }, [loadAccounts])

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.status === 'ACTIVE'),
    [accounts],
  )

  const totalBalance = useMemo(
    () =>
      activeAccounts.reduce(
        (total, account) => total + Number(account.balance),
        0,
      ),
    [activeAccounts],
  )

  const primaryCurrency = activeAccounts[0]?.currency ?? 'TRY'
  const latestAccount = useMemo(
    () =>
      [...activeAccounts].sort(
        (firstAccount, secondAccount) =>
          Number(secondAccount.balance) - Number(firstAccount.balance),
      )[0],
    [activeAccounts],
  )
  const hasAccounts = accounts.length > 0
  const accountIds = useMemo(
    () => new Set(accounts.map((account) => account.id)),
    [accounts],
  )
  const recentTransactions = transactions.slice(0, 3)
  const monthSummary = useMemo(
    () => summarizeCurrentMonth(transactions, accountIds),
    [accountIds, transactions],
  )

  return (
    <PageFrame title="Dashboard" eyebrow="Overview">
      {errorMessage ? (
        <section className="inline-error" role="alert">
          <p>{errorMessage}</p>
          <button className="text-button" type="button" onClick={loadAccounts}>
            <RefreshCw size={15} aria-hidden />
            Try again
          </button>
        </section>
      ) : null}

      <div className="dashboard-hero">
        <section className="balance-panel" aria-label="Portfolio overview">
          <div className="balance-panel-top">
            <span className="soft-icon">
              <WalletCards size={20} aria-hidden />
            </span>
          </div>
          <p className="eyebrow">Available balance</p>
          {isLoading ? (
            <span className="balance-loading" aria-label="Loading balance" />
          ) : (
            <strong className="balance-value">
              {formatMoney(totalBalance, primaryCurrency)}
            </strong>
          )}
          <p className="muted-text">
            {hasAccounts
              ? 'Your available balance is calculated from active accounts.'
              : 'Open your first account to start tracking your money in one place.'}
          </p>
          <div className="hero-actions">
            <Link className="hero-action primary" to="/accounts">
              <Plus size={17} aria-hidden />
              Open account
            </Link>
            <Link className="hero-action secondary" to="/transfer">
              <ArrowRightLeft size={17} aria-hidden />
              Make transfer
            </Link>
          </div>
        </section>
      </div>

      <div className="insight-strip">
        <MetricCard
          icon={CreditCard}
          label="Active accounts"
          value={isLoading ? 'Loading' : `${activeAccounts.length} active`}
        />
        <MetricCard
          icon={ArrowDownLeft}
          label="Money in this month"
          value={
            isLoading
              ? 'Loading'
              : formatMoney(monthSummary.incoming, primaryCurrency)
          }
        />
        <MetricCard
          icon={ArrowUpRight}
          label="Money out this month"
          value={
            isLoading
              ? 'Loading'
              : formatMoney(monthSummary.outgoing, primaryCurrency)
          }
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel account-preview">
          <div className="panel-title-row">
            <h2>Accounts</h2>
            <Link to="/accounts">Manage</Link>
          </div>
          {isLoading ? (
            <div className="skeleton-list" aria-label="Loading account preview">
              <span />
              <span />
              <span />
            </div>
          ) : latestAccount ? (
            <div className="account-preview-card">
              <span className="empty-icon">
                <CreditCard size={21} aria-hidden />
              </span>
              <div>
                <p className="eyebrow">Primary account</p>
                <strong>{latestAccount.accountNumber}</strong>
                <p className="muted-text">
                  {formatIban(latestAccount.iban)}
                </p>
                <div className="account-preview-meta">
                  <span>
                    {formatMoney(latestAccount.balance, latestAccount.currency)}
                  </span>
                  <span>{formatStatus(latestAccount.status)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">
                <CreditCard size={21} aria-hidden />
              </span>
              <div>
                <strong>No account yet</strong>
                <p className="muted-text">
                  Create your first account to see balances, transfers, and account
                  details here.
                </p>
              </div>
              <Link className="quick-action" to="/accounts">
                <Plus size={17} aria-hidden />
                Open account
              </Link>
            </div>
          )}
        </section>

        <section className="panel activity-preview">
          <div className="panel-title-row">
            <h2>Recent activity</h2>
            <Link to="/transactions">View history</Link>
          </div>
          {isLoading ? (
            <div className="skeleton-list" aria-label="Loading activity">
              <span />
              <span />
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="activity-list">
              {recentTransactions.map((transaction) => (
                <TransactionLine
                  key={transaction.id}
                  transaction={transaction}
                  isOutgoing={accountIds.has(transaction.fromAccountId)}
                />
              ))}
            </div>
          ) : (
            <>
              <div className="activity-line">
                <span />
                <div>
                  <strong>No transfers yet</strong>
                  <p className="muted-text">Your latest money movement will be shown here.</p>
                </div>
              </div>
              <div className="activity-line muted-line">
                <span />
                <div>
                  <strong>{hasAccounts ? 'Ready for transfers' : 'Ready when your account is'}</strong>
                  <p className="muted-text">
                    {hasAccounts
                      ? 'Once money moves in or out, it will appear in your activity history.'
                      : 'After opening an account, deposits and transfers will appear automatically.'}
                  </p>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </PageFrame>
  )
}

type MetricCardProps = {
  icon: LucideIcon
  label: string
  value: string
}

function MetricCard({ icon: Icon, label, value }: MetricCardProps) {
  return (
    <article className="metric-card">
      <Icon size={20} aria-hidden />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function TransactionLine({
  transaction,
  isOutgoing,
}: {
  transaction: Transaction
  isOutgoing: boolean
}) {
  const counterparty = isOutgoing
    ? transaction.toAccountHolderName
    : transaction.fromAccountHolderName
  const direction = isOutgoing ? 'Sent' : 'Received'
  const Icon = isOutgoing ? ArrowUpRight : ArrowDownLeft
  const signedAmount = `${isOutgoing ? '-' : '+'}${formatMoney(
    transaction.amount,
    transaction.currency,
  )}`

  return (
    <div className="activity-line">
      <span className={isOutgoing ? 'activity-icon outgoing' : 'activity-icon incoming'}>
        <Icon size={16} aria-hidden />
      </span>
      <div>
        <strong>
          {direction} {isOutgoing ? 'to' : 'from'} {counterparty}
        </strong>
        <p className="muted-text">{formatDateTime(transaction.createdAt)}</p>
      </div>
      <strong className={isOutgoing ? 'amount-negative' : 'amount-positive'}>
        {signedAmount}
      </strong>
    </div>
  )
}

function summarizeCurrentMonth(
  transactions: Transaction[],
  accountIds: Set<number>,
) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  return transactions.reduce(
    (summary, transaction) => {
      const transactionDate = new Date(transaction.createdAt)

      if (
        transactionDate.getMonth() !== currentMonth ||
        transactionDate.getFullYear() !== currentYear
      ) {
        return summary
      }

      if (accountIds.has(transaction.fromAccountId)) {
        return {
          ...summary,
          outgoing: summary.outgoing + Number(transaction.amount),
        }
      }

      return {
        ...summary,
        incoming: summary.incoming + Number(transaction.amount),
      }
    },
    { incoming: 0, outgoing: 0 },
  )
}

function PageFrame({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <div className="page-frame">
      <div className="page-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  )
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
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
