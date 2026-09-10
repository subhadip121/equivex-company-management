const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/

export function normalizeIsin(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)
}

export function isValidIsin(value: string) {
  return ISIN_PATTERN.test(normalizeIsin(value))
}
