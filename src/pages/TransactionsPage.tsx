import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  ReceiptText,
  RefreshCw,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { ReceiptModal } from '../components/ReceiptModal'
import { listMyAccounts, type Account } from '../features/accounts/accountsApi'
import {
  listMyTransactions,
  type Transaction,
} from '../features/transactions/transactionsApi'
import { accountEndingLabel } from '../lib/accountDisplay'
import { downloadReceipt } from '../lib/receiptUtils'

const INITIAL_VISIBLE_TRANSACTIONS = 10
const VISIBLE_TRANSACTION_STEP = 10

type DirectionFilter = 'all' | 'sent' | 'received'

export function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_TRANSACTIONS)

  const loadTransactions = useCallback(async () => {
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
      setErrorMessage('Transactions could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTransactions()
  }, [loadTransactions])

  const accountIds = useMemo(
    () => new Set(accounts.map((account) => account.id)),
    [accounts],
  )

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const isOutgoing = accountIds.has(transaction.fromAccountId)
        const transactionTime = new Date(transaction.createdAt).getTime()
        const startTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
        const endTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null
        const minimumAmount = minAmount ? Number(minAmount) : null
        const maximumAmount = maxAmount ? Number(maxAmount) : null

        if (directionFilter === 'sent' && !isOutgoing) {
          return false
        }

        if (directionFilter === 'received' && isOutgoing) {
          return false
        }

        if (startTime !== null && transactionTime < startTime) {
          return false
        }

        if (endTime !== null && transactionTime > endTime) {
          return false
        }

        if (minimumAmount !== null && transaction.amount < minimumAmount) {
          return false
        }

        if (maximumAmount !== null && transaction.amount > maximumAmount) {
          return false
        }

        return true
      }),
    [accountIds, dateFrom, dateTo, directionFilter, maxAmount, minAmount, transactions],
  )

  const visibleTransactions = filteredTransactions.slice(0, visibleCount)
  const hasActiveFilters =
    directionFilter !== 'all' || dateFrom || dateTo || minAmount || maxAmount
  const hasMoreTransactions = visibleCount < filteredTransactions.length

  function handleDirectionFilterChange(nextFilter: DirectionFilter) {
    setDirectionFilter(nextFilter)
    setVisibleCount(INITIAL_VISIBLE_TRANSACTIONS)
  }

  function handleFilterInputChange(
    setter: (value: string) => void,
    nextValue: string,
  ) {
    setter(nextValue)
    setVisibleCount(INITIAL_VISIBLE_TRANSACTIONS)
  }

  function resetFilters() {
    setDirectionFilter('all')
    setDateFrom('')
    setDateTo('')
    setMinAmount('')
    setMaxAmount('')
    setVisibleCount(INITIAL_VISIBLE_TRANSACTIONS)
  }

  return (
    <div className="page-frame">
      <div className="page-heading">
        <p className="eyebrow">Transactions</p>
        <h1>Transaction history</h1>
      </div>

      {errorMessage ? (
        <section className="inline-error" role="alert">
          <p>{errorMessage}</p>
          <button className="text-button" type="button" onClick={loadTransactions}>
            <RefreshCw size={15} aria-hidden />
            Try again
          </button>
        </section>
      ) : null}

      <section className="panel transactions-panel">
        <div className="panel-title-row">
          <h2>Recent money movement</h2>
          <span className="status-badge status-active">
            {filteredTransactions.length} of {transactions.length}
          </span>
        </div>

        {transactions.length > 0 ? (
          <div className="transaction-filters" aria-label="Transaction filters">
            <div className="transaction-filter-heading">
              <span className="empty-icon">
                <Filter size={18} aria-hidden />
              </span>
              <div>
                <strong>Filters</strong>
              </div>
            </div>

            <fieldset className="segmented-field">
              <legend>Direction</legend>
              <div className="segmented-control transaction-direction-control">
                <button
                  className={directionFilter === 'all' ? 'active' : ''}
                  type="button"
                  onClick={() => handleDirectionFilterChange('all')}
                >
                  All
                </button>
                <button
                  className={directionFilter === 'sent' ? 'active' : ''}
                  type="button"
                  onClick={() => handleDirectionFilterChange('sent')}
                >
                  Sent
                </button>
                <button
                  className={directionFilter === 'received' ? 'active' : ''}
                  type="button"
                  onClick={() => handleDirectionFilterChange('received')}
                >
                  Received
                </button>
              </div>
            </fieldset>

            <div className="transaction-filter-grid">
              <label>
                From date
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) =>
                    handleFilterInputChange(setDateFrom, event.target.value)
                  }
                />
              </label>
              <label>
                To date
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) =>
                    handleFilterInputChange(setDateTo, event.target.value)
                  }
                />
              </label>
              <label>
                Minimum amount
                <input
                  min="0"
                  step="0.01"
                  type="number"
                  value={minAmount}
                  onChange={(event) =>
                    handleFilterInputChange(setMinAmount, event.target.value)
                  }
                  placeholder="0.00"
                />
              </label>
              <label>
                Maximum amount
                <input
                  min="0"
                  step="0.01"
                  type="number"
                  value={maxAmount}
                  onChange={(event) =>
                    handleFilterInputChange(setMaxAmount, event.target.value)
                  }
                  placeholder="0.00"
                />
              </label>
            </div>

            {hasActiveFilters ? (
              <button className="text-action-button" type="button" onClick={resetFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
        ) : null}

        {isLoading ? (
          <div className="skeleton-list" aria-label="Loading transactions">
            <span />
            <span />
            <span />
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <ReceiptText size={21} aria-hidden />
            </span>
            <div>
              <strong>No transactions yet</strong>
              <p className="muted-text">
                Completed transfers will appear here with recipient details, amount,
                status, and time.
              </p>
            </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <ReceiptText size={21} aria-hidden />
            </span>
            <div>
              <strong>No matching transactions</strong>
              <p className="muted-text">
                Adjust the filters to find a different set of transactions.
              </p>
            </div>
            <button className="secondary-button" type="button" onClick={resetFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="transaction-results">
            <div className="transaction-list">
              {visibleTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  isOutgoing={accountIds.has(transaction.fromAccountId)}
                  onViewReceipt={setReceiptTransaction}
                />
              ))}
            </div>

            <div className="transaction-list-footer">
              <span>
                Showing {visibleTransactions.length} of {filteredTransactions.length}
              </span>
              {hasMoreTransactions ? (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    setVisibleCount(
                      (currentCount) => currentCount + VISIBLE_TRANSACTION_STEP,
                    )
                  }
                >
                  Load more
                </button>
              ) : null}
            </div>
          </div>
        )}
      </section>

      {receiptTransaction ? (
        <ReceiptModal
          transaction={receiptTransaction}
          onClose={() => setReceiptTransaction(null)}
        />
      ) : null}
    </div>
  )
}

function TransactionRow({
  transaction,
  isOutgoing,
  onViewReceipt,
}: {
  transaction: Transaction
  isOutgoing: boolean
  onViewReceipt: (transaction: Transaction) => void
}) {
  const Icon = isOutgoing ? ArrowUpRight : ArrowDownLeft
  const direction = isOutgoing ? 'Sent' : 'Received'
  const counterpartyLabel = isOutgoing ? 'To' : 'From'
  const counterpartyAccount = isOutgoing
    ? transaction.toAccountNumber
    : transaction.fromAccountNumber
  const counterpartyName = isOutgoing
    ? transaction.toAccountHolderName
    : transaction.fromAccountHolderName
  const signedAmount = `${isOutgoing ? '-' : '+'}${formatMoney(
    transaction.amount,
    transaction.currency,
  )}`

  return (
    <article className="transaction-row">
      <span className="empty-icon">
        <Icon size={20} aria-hidden />
      </span>
      <div className="transaction-main">
        <strong>{direction}</strong>
        <p className="muted-text">
          {counterpartyLabel} {counterpartyName}
        </p>
        <p className="muted-text">
          {accountEndingLabel(counterpartyAccount)}
          {transaction.description ? ` - ${transaction.description}` : ''}
        </p>
      </div>
      <div className="transaction-meta">
        <strong className={isOutgoing ? 'amount-negative' : 'amount-positive'}>
          {signedAmount}
        </strong>
        <span>{formatDateTime(transaction.createdAt)}</span>
        <div className="transaction-actions">
          <button
            className="text-action-button"
            type="button"
            onClick={() => onViewReceipt(transaction)}
          >
            View
          </button>
          <button
            className="text-action-button"
            type="button"
            onClick={() => downloadReceipt(transaction)}
          >
            Download
          </button>
        </div>
      </div>
    </article>
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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
