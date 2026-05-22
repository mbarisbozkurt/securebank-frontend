import {
  ArrowRightLeft,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  Send,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { ReceiptModal } from '../components/ReceiptModal'
import { Spinner } from '../components/Spinner'
import { useToast } from '../components/toastContext'
import {
  createBeneficiary,
  listBeneficiaries,
  type Beneficiary,
} from '../features/beneficiaries/beneficiariesApi'
import {
  listMyAccounts,
  resolveRecipientByIban,
  type Account,
  type RecipientPreview,
} from '../features/accounts/accountsApi'
import { type Transaction } from '../features/transactions/transactionsApi'
import { createTransfer } from '../features/transfers/transfersApi'
import { ApiClientError } from '../lib/apiClient'
import { maskAccountNumber } from '../lib/accountDisplay'
import { withMinDelay } from '../lib/minDelay'

export function TransferPage() {
  const [searchParams] = useSearchParams()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [fromAccountId, setFromAccountId] = useState('')
  const [destinationValue, setDestinationValue] = useState('')
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [shouldSaveRecipient, setShouldSaveRecipient] = useState(false)
  const [recipientNickname, setRecipientNickname] = useState('')
  const [isReviewing, setIsReviewing] = useState(false)
  const [recipientPreview, setRecipientPreview] =
    useState<RecipientPreview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(true)
  const [isResolvingRecipient, setIsResolvingRecipient] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [saveRecipientMessage, setSaveRecipientMessage] = useState('')
  const [successTransfer, setSuccessTransfer] = useState<Transaction | null>(null)
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(
    null,
  )
  const { showToast } = useToast()

  const loadAccounts = useCallback(async () => {
    setErrorMessage('')
    setIsLoading(true)

    try {
      const response = await listMyAccounts()
      setAccounts(response)
      setFromAccountId((currentValue) => {
        if (currentValue) {
          return currentValue
        }

        return String(response.find((account) => account.status === 'ACTIVE')?.id ?? '')
      })
    } catch {
      setErrorMessage('Transfer details could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAccounts()
  }, [loadAccounts])

  const loadBeneficiaries = useCallback(async () => {
    setIsLoadingBeneficiaries(true)

    try {
      const response = await listBeneficiaries()
      setBeneficiaries(response)
    } catch {
      setBeneficiaries([])
    } finally {
      setIsLoadingBeneficiaries(false)
    }
  }, [])

  useEffect(() => {
    void loadBeneficiaries()
  }, [loadBeneficiaries])

  useEffect(() => {
    const iban = searchParams.get('iban')

    if (!iban) {
      return
    }

    setDestinationValue(formatIbanInput(iban))
    setIsReviewing(false)
    setRecipientPreview(null)
    setShouldSaveRecipient(false)
    setRecipientNickname('')
  }, [searchParams])

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.status === 'ACTIVE'),
    [accounts],
  )

  const selectedAccount = activeAccounts.find(
    (account) => account.id === Number(fromAccountId),
  )

  const isRecipientAlreadySaved =
    recipientPreview !== null &&
    beneficiaries.some(
      (beneficiary) =>
        beneficiary.accountNumber.toLowerCase() ===
          recipientPreview.accountNumber.toLowerCase() ||
        beneficiary.iban.toLowerCase() === recipientPreview.iban.toLowerCase(),
    )

  async function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setSaveRecipientMessage('')
    setSuccessTransfer(null)

    if (!validateTransferDetails()) {
      return
    }

    setIsResolvingRecipient(true)

    try {
      const preview = await withMinDelay(
        resolveRecipientByIban(normalizeIbanValue(destinationValue)),
      )
      setRecipientPreview(preview)
      setShouldSaveRecipient(false)
      setRecipientNickname('')
      setIsReviewing(true)
    } catch (error) {
      setRecipientPreview(null)
      setErrorMessage(getRecipientPreviewErrorMessage(error))
    } finally {
      setIsResolvingRecipient(false)
    }
  }

  async function handleConfirmTransfer() {
    setErrorMessage('')
    setSaveRecipientMessage('')

    if (!validateTransferDetails()) {
      setIsReviewing(false)
      return
    }

    const normalizedDescription = description.trim()
    const normalizedDestination = normalizeIbanValue(destinationValue)

    setIsSubmitting(true)

    try {
      const response = await withMinDelay(
        createTransfer({
          fromAccountId: Number(fromAccountId),
          toIban: normalizedDestination,
          amount: Number(amount),
          description: normalizedDescription || undefined,
        }),
      )

      setSuccessTransfer(response)
      showToast('Transfer completed.')
      if (shouldSaveRecipient && recipientPreview && !isRecipientAlreadySaved) {
        await saveRecipient(recipientPreview)
      }
      setDestinationValue('')
      setAmount('')
      setDescription('')
      setShouldSaveRecipient(false)
      setRecipientNickname('')
      setIsReviewing(false)
      setRecipientPreview(null)
      await loadAccounts()
    } catch (error) {
      setErrorMessage(getTransferErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleEditDetails() {
    setErrorMessage('')
    setIsReviewing(false)
    setRecipientPreview(null)
  }

  function resetReview() {
    setIsReviewing(false)
    setRecipientPreview(null)
    setShouldSaveRecipient(false)
    setRecipientNickname('')
  }

  function validateTransferDetails() {
    const normalizedDestination = normalizeIbanValue(destinationValue)

    if (!fromAccountId || !normalizedDestination || !amount) {
      setErrorMessage('Choose an account and enter transfer details.')
      return false
    }

    if (!isValidTurkishIban(normalizedDestination)) {
      setErrorMessage('Enter a valid Turkish IBAN.')
      return false
    }

    if (
      selectedAccount &&
      selectedAccount.iban.toLowerCase() === normalizedDestination.toLowerCase()
    ) {
      setErrorMessage('Choose a different recipient account.')
      return false
    }

    if (Number(amount) < 0.01) {
      setErrorMessage('Transfer amount must be at least 0.01.')
      return false
    }

    return true
  }

  async function saveRecipient(preview: RecipientPreview) {
    try {
      const savedRecipient = await withMinDelay(
        createBeneficiary({
          iban: preview.iban,
          nickname: recipientNickname.trim() || undefined,
        }),
      )
      setBeneficiaries((currentBeneficiaries) => [
        savedRecipient,
        ...currentBeneficiaries,
      ])
      setSaveRecipientMessage('Recipient saved for future transfers.')
      showToast('Recipient saved.')
    } catch {
      setSaveRecipientMessage('Transfer completed, but recipient could not be saved.')
    }
  }

  function chooseBeneficiary(beneficiary: Beneficiary) {
    setDestinationValue(formatIbanInput(beneficiary.iban))
    setSaveRecipientMessage('')
    resetReview()
  }

  return (
    <div className="page-frame">
      <div className="page-heading">
        <p className="eyebrow">Transfer</p>
        <h1>Move money securely</h1>
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

      <div className="transfer-grid">
        <section className="panel transfer-panel">
          <div className="panel-title-row">
            <h2>Transfer details</h2>
            <span className="status-badge status-active">Protected</span>
          </div>

          {isLoading ? (
            <div className="skeleton-list" aria-label="Loading transfer form">
              <span />
              <span />
              <span />
            </div>
          ) : activeAccounts.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">
                <CreditCard size={21} aria-hidden />
              </span>
              <div>
                <strong>No active account available</strong>
                <p className="muted-text">
                  Open an active account before sending money.
                </p>
              </div>
              <Link className="quick-action" to="/accounts">
                Open account
              </Link>
            </div>
          ) : (
            <form className="form-grid" onSubmit={handleReview} noValidate>
              <label>
                From account
                <select
                  value={fromAccountId}
                  onChange={(event) => {
                    setFromAccountId(event.target.value)
                    resetReview()
                  }}
                  disabled={isReviewing}
                  required
                >
                  {activeAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountNumber} -{' '}
                      {formatMoney(account.balance, account.currency)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="field-heading">
                  <span>Recipient IBAN</span>
                </span>
                <input
                  type="text"
                  maxLength={32}
                  value={destinationValue}
                  onChange={(event) => {
                    setDestinationValue(formatIbanInput(event.target.value))
                    resetReview()
                  }}
                  placeholder="TR62 0006 2000 0000 0000 0000 00"
                  disabled={isReviewing}
                  required
                />
              </label>

              <section className="saved-recipient-list" aria-label="Saved recipients">
                <div className="field-heading">
                  <span>Saved recipients</span>
                  {isLoadingBeneficiaries ? (
                    <span className="field-note">Loading...</span>
                  ) : null}
                </div>
                {beneficiaries.length > 0 ? (
                  <div className="saved-recipient-buttons">
                    {beneficiaries.map((beneficiary) => (
                      <button
                        key={beneficiary.id}
                        type="button"
                        onClick={() => chooseBeneficiary(beneficiary)}
                        disabled={isReviewing}
                      >
                        <span>
                          {beneficiary.nickname?.trim() ||
                            beneficiary.recipientName}
                        </span>
                        <small>{formatIban(beneficiary.iban)}</small>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="field-note">
                    Saved recipients will appear here after your first transfer.
                  </p>
                )}
              </section>

              <label>
                Amount
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value)
                    resetReview()
                  }}
                  disabled={isReviewing}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  maxLength={255}
                  rows={4}
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value)
                    resetReview()
                  }}
                  disabled={isReviewing}
                />
              </label>

              {isReviewing && selectedAccount ? (
                <section className="transfer-review" aria-label="Review transfer">
                  <div className="panel-title-row">
                    <h3>Review transfer</h3>
                    <span className="status-badge status-active">Ready</span>
                  </div>
                  <dl className="review-list">
                    <div>
                      <dt>From</dt>
                      <dd>{selectedAccount.accountNumber}</dd>
                    </div>
                    <div>
                      <dt>To account</dt>
                      <dd>
                        <span>
                          {formatIban(recipientPreview?.iban ?? destinationValue)}
                        </span>
                        <span className="review-subtext">
                          {recipientPreview?.recipientName ?? 'SecureBank customer'}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt>Amount</dt>
                      <dd>{formatMoney(Number(amount), selectedAccount.currency)}</dd>
                    </div>
                    {description.trim() ? (
                      <div>
                        <dt>Description</dt>
                        <dd>{description.trim()}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {!isRecipientAlreadySaved ? (
                    <div className="save-recipient-option">
                      <label>
                        <input
                          type="checkbox"
                          checked={shouldSaveRecipient}
                          onChange={(event) =>
                            setShouldSaveRecipient(event.target.checked)
                          }
                          disabled={isSubmitting}
                        />
                        Save this recipient
                      </label>
                      {shouldSaveRecipient ? (
                        <input
                          type="text"
                          maxLength={80}
                          value={recipientNickname}
                          onChange={(event) =>
                            setRecipientNickname(event.target.value)
                          }
                          placeholder="Nickname (optional)"
                          disabled={isSubmitting}
                        />
                      ) : null}
                    </div>
                  ) : (
                    <p className="field-note">This recipient is already saved.</p>
                  )}
                  <div className="form-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={handleEditDetails}
                      disabled={isSubmitting}
                    >
                      Edit details
                    </button>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={handleConfirmTransfer}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={17} aria-hidden />
                          Confirm transfer
                        </>
                      )}
                    </button>
                  </div>
                </section>
              ) : (
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isSubmitting || isResolvingRecipient}
                >
                  {isResolvingRecipient ? (
                    <>
                      <Spinner />
                      Checking recipient...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft size={17} aria-hidden />
                      Continue
                    </>
                  )}
                </button>
              )}
            </form>
          )}
        </section>

        <section className="balance-panel transfer-overview" aria-label="Transfer overview">
          <div className="balance-panel-top">
            <span className="soft-icon">
              <ArrowRightLeft size={20} aria-hidden />
            </span>
          </div>
          <p className="eyebrow">Available to send</p>
          <strong className="balance-value">
            {selectedAccount
              ? formatMoney(selectedAccount.balance, selectedAccount.currency)
              : formatMoney(0, 'TRY')}
          </strong>
          <p className="muted-text">
            {selectedAccount
              ? `From ${selectedAccount.accountNumber}`
              : 'Choose an active account to see its available balance.'}
          </p>
        </section>
      </div>

      {successTransfer ? (
        <section className="panel transfer-result">
          <span className="empty-icon">
            <CheckCircle2 size={21} aria-hidden />
          </span>
          <div>
            <p className="eyebrow">Transfer complete</p>
            <h2>
              {formatMoney(successTransfer.amount, successTransfer.currency)} sent
            </h2>
            <p className="muted-text">
              {maskAccountNumber(successTransfer.fromAccountNumber)} to{' '}
              {successTransfer.toAccountHolderName} (
              {maskAccountNumber(successTransfer.toAccountNumber)})
            </p>
            {saveRecipientMessage ? (
              <p className="muted-text">{saveRecipientMessage}</p>
            ) : null}
            <div className="form-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setReceiptTransaction(successTransfer)}
              >
                View receipt
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {receiptTransaction ? (
        <ReceiptModal
          transaction={receiptTransaction}
          onClose={() => setReceiptTransaction(null)}
        />
      ) : null}
    </div>
  )
}

function getRecipientPreviewErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 404) {
      return 'Recipient account could not be found.'
    }

    if (error.details.message === 'Invalid IBAN') {
      return 'Enter a valid Turkish IBAN.'
    }
  }

  return 'Recipient could not be verified.'
}

function getTransferErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.details.validationErrors) {
      return Object.values(error.details.validationErrors).join(' ')
    }

    if (error.status === 403) {
      return 'You can transfer only from your own active accounts.'
    }

    if (error.status === 404) {
      return 'Recipient account could not be found.'
    }

    if (error.details.message === 'Invalid IBAN') {
      return 'Enter a valid Turkish IBAN.'
    }

    if (error.details.message === 'Insufficient balance') {
      return 'Your selected account does not have enough balance.'
    }

    if (error.details.message === 'Cannot transfer to the same account') {
      return 'Choose a different recipient account.'
    }

    if (error.details.message === 'Both accounts must be active') {
      return 'Both accounts must be active to complete this transfer.'
    }

    if (error.details.message === 'Currency mismatch') {
      return 'Both accounts must use the same currency.'
    }
  }

  return 'Transfer could not be completed.'
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}

function normalizeIbanValue(value: string) {
  return value.trim().replace(/\s+/g, '').toUpperCase()
}

function formatIban(value: string) {
  return normalizeIbanValue(value).replace(/(.{4})/g, '$1 ').trim()
}

function formatIbanInput(value: string) {
  return normalizeIbanValue(value).slice(0, 26).replace(/(.{4})/g, '$1 ').trim()
}

function isValidTurkishIban(value: string) {
  if (!/^TR[A-Z0-9]{24}$/.test(value)) {
    return false
  }

  return mod97(`${value.slice(4)}2927${value.slice(2, 4)}`) === 1
}

function mod97(value: string) {
  let remainder = 0

  for (const character of value) {
    if (!/\d/.test(character)) {
      return -1
    }

    remainder = (remainder * 10 + Number(character)) % 97
  }

  return remainder
}
