export function maskAccountNumber(accountNumber: string) {
  const normalizedValue = accountNumber.trim()

  if (normalizedValue.length <= 6) {
    return normalizedValue
  }

  return `${normalizedValue.slice(0, 8)}••••${normalizedValue.slice(-2)}`
}

export function accountEndingLabel(accountNumber: string) {
  const normalizedValue = accountNumber.trim()

  if (normalizedValue.length <= 4) {
    return `******* ${normalizedValue}`
  }

  return `******* ${normalizedValue.slice(-4)}`
}
