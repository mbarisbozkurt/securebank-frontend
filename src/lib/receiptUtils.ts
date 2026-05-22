import type { Transaction } from '../features/transactions/transactionsApi'
import type { jsPDF as JsPDF } from 'jspdf'
import { maskAccountNumber } from './accountDisplay'

export async function downloadReceipt(transaction: Transaction) {
  const { jsPDF } = await import('jspdf')
  const document = new jsPDF({
    format: 'a4',
    orientation: 'portrait',
    unit: 'pt',
  })
  const rows = getReceiptRows(transaction)
  const pageWidth = document.internal.pageSize.getWidth()
  const margin = 48
  const contentWidth = pageWidth - margin * 2
  let y = 54

  document.setFillColor(247, 250, 248)
  document.roundedRect(margin, 38, contentWidth, 720, 8, 8, 'F')
  document.setDrawColor(220, 230, 224)
  document.roundedRect(margin, 38, contentWidth, 720, 8, 8)

  document.setFont('helvetica', 'bold')
  document.setFontSize(20)
  document.setTextColor(18, 33, 29)
  document.text('SecureBank', margin + 24, y)

  document.setFont('helvetica', 'normal')
  document.setFontSize(11)
  document.setTextColor(101, 117, 112)
  document.text('Transfer receipt', margin + 24, y + 18)

  document.setFont('helvetica', 'bold')
  document.setFontSize(10)
  document.setTextColor(15, 70, 59)
  document.text(formatReceiptStatus(transaction.status), pageWidth - margin - 24, y, {
    align: 'right',
  })

  y += 54
  drawDivider(document, margin + 24, y, contentWidth - 48)

  y += 36
  document.setFont('helvetica', 'normal')
  document.setFontSize(11)
  document.setTextColor(101, 117, 112)
  document.text('Amount', margin + 24, y)

  y += 32
  document.setFont('helvetica', 'bold')
  document.setFontSize(28)
  document.setTextColor(18, 33, 29)
  document.text(formatReceiptMoney(transaction.amount, transaction.currency), margin + 24, y)

  y += 38
  rows.forEach(([label, value]) => {
    const wrappedValue = document.splitTextToSize(value, contentWidth - 210)
    const rowHeight = Math.max(34, wrappedValue.length * 14 + 16)

    drawDivider(document, margin + 24, y, contentWidth - 48)

    y += 22
    document.setFont('helvetica', 'bold')
    document.setFontSize(9)
    document.setTextColor(101, 117, 112)
    document.text(label.toUpperCase(), margin + 24, y)

    document.setFont('helvetica', 'bold')
    document.setFontSize(11)
    document.setTextColor(18, 33, 29)
    document.text(wrappedValue, margin + 180, y)

    y += rowHeight
  })

  document.save(`securebank-receipt-${transaction.id}.pdf`)
}

export function formatReceiptMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}

export function formatReceiptDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatReceiptType(type: Transaction['type']) {
  const labels: Record<Transaction['type'], string> = {
    TRANSFER: 'Transfer',
  }

  return labels[type]
}

export function formatReceiptStatus(status: Transaction['status']) {
  const labels: Record<Transaction['status'], string> = {
    COMPLETED: 'Completed',
    FAILED: 'Failed',
  }

  return labels[status]
}

function getReceiptRows(transaction: Transaction): Array<[string, string]> {
  return [
    ['Transaction ID', `#${transaction.id}`],
    ['Date', formatReceiptDateTime(transaction.createdAt)],
    ['From', transaction.fromAccountHolderName],
    ['From account', maskAccountNumber(transaction.fromAccountNumber)],
    ['To', transaction.toAccountHolderName],
    ['To account', maskAccountNumber(transaction.toAccountNumber)],
    ['Type', formatReceiptType(transaction.type)],
    ['Status', formatReceiptStatus(transaction.status)],
    ...(transaction.description
      ? ([['Description', transaction.description]] as Array<[string, string]>)
      : []),
  ]
}

function drawDivider(
  document: JsPDF,
  x: number,
  y: number,
  width: number,
) {
  document.setDrawColor(228, 236, 232)
  document.line(x, y, x + width, y)
}
