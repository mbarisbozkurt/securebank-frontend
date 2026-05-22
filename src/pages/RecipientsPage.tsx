import {
  Check,
  Pencil,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserRoundCheck,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Spinner } from '../components/Spinner'
import { useToast } from '../components/toastContext'
import {
  deleteBeneficiary,
  listBeneficiaries,
  updateBeneficiary,
  type Beneficiary,
} from '../features/beneficiaries/beneficiariesApi'
import { withMinDelay } from '../lib/minDelay'

export function RecipientsPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingBeneficiaryId, setDeletingBeneficiaryId] = useState<number | null>(
    null,
  )
  const [editingBeneficiaryId, setEditingBeneficiaryId] = useState<number | null>(
    null,
  )
  const [updatingBeneficiaryId, setUpdatingBeneficiaryId] = useState<number | null>(
    null,
  )
  const [nicknameDraft, setNicknameDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const { showToast } = useToast()

  const loadBeneficiaries = useCallback(async () => {
    setErrorMessage('')
    setIsLoading(true)

    try {
      const response = await listBeneficiaries()
      setBeneficiaries(response)
    } catch {
      setErrorMessage('Recipients could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBeneficiaries()
  }, [loadBeneficiaries])

  const filteredBeneficiaries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return beneficiaries
    }

    return beneficiaries.filter((beneficiary) => {
      const searchableValue = [
        beneficiary.nickname,
        beneficiary.recipientName,
        beneficiary.iban,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableValue.includes(normalizedQuery)
    })
  }, [beneficiaries, searchQuery])

  async function handleDeleteBeneficiary(beneficiaryId: number) {
    setErrorMessage('')
    setDeletingBeneficiaryId(beneficiaryId)

    try {
      await withMinDelay(deleteBeneficiary(beneficiaryId))
      setBeneficiaries((currentBeneficiaries) =>
        currentBeneficiaries.filter(
          (beneficiary) => beneficiary.id !== beneficiaryId,
        ),
      )
      showToast('Recipient removed.')
    } catch {
      setErrorMessage('Recipient could not be removed.')
    } finally {
      setDeletingBeneficiaryId(null)
    }
  }

  function startEditing(beneficiary: Beneficiary) {
    setErrorMessage('')
    setEditingBeneficiaryId(beneficiary.id)
    setNicknameDraft(beneficiary.nickname ?? '')
  }

  function cancelEditing() {
    setEditingBeneficiaryId(null)
    setNicknameDraft('')
  }

  async function handleUpdateNickname(beneficiaryId: number) {
    setErrorMessage('')
    setUpdatingBeneficiaryId(beneficiaryId)

    try {
      const updatedBeneficiary = await withMinDelay(
        updateBeneficiary(beneficiaryId, {
          nickname: nicknameDraft.trim() || null,
        }),
      )
      setBeneficiaries((currentBeneficiaries) =>
        currentBeneficiaries.map((beneficiary) =>
          beneficiary.id === beneficiaryId ? updatedBeneficiary : beneficiary,
        ),
      )
      showToast('Recipient updated.')
      cancelEditing()
    } catch {
      setErrorMessage('Recipient could not be updated.')
    } finally {
      setUpdatingBeneficiaryId(null)
    }
  }

  return (
    <div className="page-frame">
      <div className="page-heading">
        <p className="eyebrow">Recipients</p>
        <h1>Saved recipients</h1>
      </div>

      {errorMessage ? (
        <section className="inline-error" role="alert">
          <p>{errorMessage}</p>
          <button className="text-button" type="button" onClick={loadBeneficiaries}>
            <RefreshCw size={15} aria-hidden />
            Try again
          </button>
        </section>
      ) : null}

      <section className="panel recipients-panel">
        <div className="panel-title-row">
          <h2>Transfer recipients</h2>
          <span className="status-badge status-active">
            {beneficiaries.length} saved
          </span>
        </div>

        {beneficiaries.length > 0 ? (
          <label className="search-field">
            <Search size={16} aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name or IBAN"
            />
          </label>
        ) : null}

        {isLoading ? (
          <div className="skeleton-list" aria-label="Loading recipients">
            <span />
            <span />
            <span />
          </div>
        ) : beneficiaries.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <UserRoundCheck size={21} aria-hidden />
            </span>
            <div>
              <strong>No saved recipients yet</strong>
              <p className="muted-text">
                Save a recipient during transfer review to reuse their IBAN later.
              </p>
            </div>
            <Link className="quick-action" to="/transfer">
              Make transfer
            </Link>
          </div>
        ) : filteredBeneficiaries.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Search size={21} aria-hidden />
            </span>
            <div>
              <strong>No matching recipients</strong>
              <p className="muted-text">
                Try a different name or IBAN.
              </p>
            </div>
          </div>
        ) : (
          <div className="recipients-grid">
            {filteredBeneficiaries.map((beneficiary) => (
              <article className="recipient-card" key={beneficiary.id}>
                <div>
                  {editingBeneficiaryId === beneficiary.id ? (
                    <div className="recipient-edit-row">
                      <input
                        type="text"
                        maxLength={80}
                        value={nicknameDraft}
                        onChange={(event) => setNicknameDraft(event.target.value)}
                        placeholder="Nickname"
                      />
                      <button
                        className="icon-only-button"
                        type="button"
                        onClick={() => handleUpdateNickname(beneficiary.id)}
                        disabled={updatingBeneficiaryId === beneficiary.id}
                        aria-label="Save nickname"
                      >
                        {updatingBeneficiaryId === beneficiary.id ? (
                          <Spinner size={14} />
                        ) : (
                          <Check size={16} aria-hidden />
                        )}
                      </button>
                      <button
                        className="icon-only-button"
                        type="button"
                        onClick={cancelEditing}
                        aria-label="Cancel nickname edit"
                      >
                        <X size={16} aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <div className="recipient-title-row">
                      <p className="eyebrow">
                        {beneficiary.nickname?.trim() || 'Saved recipient'}
                      </p>
                      <button
                        className="icon-only-button"
                        type="button"
                        onClick={() => startEditing(beneficiary)}
                        aria-label="Edit nickname"
                      >
                        <Pencil size={15} aria-hidden />
                      </button>
                    </div>
                  )}
                  <h2>{beneficiary.recipientName}</h2>
                  <p className="account-iban">{formatIban(beneficiary.iban)}</p>
                </div>

                <div className="recipient-card-bottom">
                  <div className="recipient-actions">
                    <Link
                      className="secondary-button"
                      to={`/transfer?iban=${encodeURIComponent(beneficiary.iban)}`}
                    >
                      <Send size={16} aria-hidden />
                      Send money
                    </Link>
                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => handleDeleteBeneficiary(beneficiary.id)}
                      disabled={deletingBeneficiaryId === beneficiary.id}
                    >
                      {deletingBeneficiaryId === beneficiary.id ? (
                        <>
                          <Spinner />
                          Removing...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} aria-hidden />
                          Remove
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function formatIban(value: string) {
  return value.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim()
}
