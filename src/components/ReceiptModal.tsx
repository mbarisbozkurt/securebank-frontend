import { Download, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

import type { Transaction } from '../features/transactions/transactionsApi'
import { maskAccountNumber } from '../lib/accountDisplay'
import {
  downloadReceipt,
  formatReceiptDateTime,
  formatReceiptMoney,
  formatReceiptStatus,
  formatReceiptType,
} from '../lib/receiptUtils'

type ReceiptModalProps = {
  transaction: Transaction
  onClose: () => void
}

export function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  const modalRef = useRef<HTMLElement>(null)

  useEffect(() => {
    modalRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        ref={modalRef}
        className="receipt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="receipt-modal-header">
          <div>
            <p className="eyebrow">Receipt</p>
            <h2 id="receipt-title">Transfer receipt</h2>
          </div>
          <button
            className="icon-only-button"
            type="button"
            onClick={onClose}
            aria-label="Close receipt"
          >
            <X size={17} aria-hidden />
          </button>
        </div>

        <ReceiptContent transaction={transaction} />

        <div className="form-actions">
          <button
            className="primary-button"
            type="button"
            onClick={() => downloadReceipt(transaction)}
          >
            <Download size={16} aria-hidden />
            Download
          </button>
        </div>
      </section>
    </div>
  )
}

function ReceiptContent({ transaction }: { transaction: Transaction }) {
  return (
    <div className="receipt-document">
      <div className="receipt-brand-row">
        <div>
          <strong>SecureBank</strong>
          <span>Transfer receipt</span>
        </div>
        <span className="status-badge status-active">
          {formatReceiptStatus(transaction.status)}
        </span>
      </div>

      <div className="receipt-amount">
        <span>Amount</span>
        <strong>
          {formatReceiptMoney(transaction.amount, transaction.currency)}
        </strong>
      </div>

      <dl className="receipt-details">
        <ReceiptItem label="Transaction ID" value={`#${transaction.id}`} />
        <ReceiptItem
          label="Date"
          value={formatReceiptDateTime(transaction.createdAt)}
        />
        <ReceiptItem label="From" value={transaction.fromAccountHolderName} />
        <ReceiptItem
          label="From account"
          value={maskAccountNumber(transaction.fromAccountNumber)}
        />
        <ReceiptItem label="To" value={transaction.toAccountHolderName} />
        <ReceiptItem
          label="To account"
          value={maskAccountNumber(transaction.toAccountNumber)}
        />
        <ReceiptItem label="Type" value={formatReceiptType(transaction.type)} />
        <ReceiptItem
          label="Status"
          value={formatReceiptStatus(transaction.status)}
        />
        {transaction.description ? (
          <ReceiptItem label="Description" value={transaction.description} />
        ) : null}
      </dl>
    </div>
  )
}

function ReceiptItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
