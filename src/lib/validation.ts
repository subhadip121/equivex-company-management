/**
 * Field rules shared by the company forms. Each returns an error message,
 * or null when the value is acceptable.
 */

/** Indian CIN: 21 characters, e.g. L22210MH1995PLC084781 */
const CIN_PATTERN = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_PATTERN = /^[0-9]{10}$/

export function required(value: string, label: string) {
  return value.trim() ? null : `${label} is required.`
}

export function validateCin(value: string) {
  const normalized = value.trim().toUpperCase()
  if (!normalized) return "CIN is required."
  if (normalized.length !== 21) return "A CIN is 21 characters long."
  if (!CIN_PATTERN.test(normalized)) return "That does not look like a valid CIN."
  return null
}

export function validateEmail(value: string) {
  if (!value.trim()) return "Email is required."
  return EMAIL_PATTERN.test(value.trim()) ? null : "Enter a valid email address."
}

export function validatePhone(value: string) {
  const digits = value.replace(/\D/g, "")
  if (!digits) return "Phone number is required."
  return PHONE_PATTERN.test(digits) ? null : "Enter a 10-digit phone number."
}

/** Optional: only checked when the field has been filled in. */
export function validateWebsite(value: string) {
  if (!value.trim()) return null
  return /^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(value.trim().replace(/^https?:\/\//i, ""))
    ? null
    : "Enter a valid website, for example www.example.com"
}

/** Digits only, for whole-number fields such as a share count. */
export function validateWholeNumber(value: string, label: string) {
  const trimmed = value.trim()
  if (!trimmed) return `${label} is required.`
  if (!/^\d+$/.test(trimmed)) return `${label} must be a whole number.`
  if (Number(trimmed) <= 0) return `${label} must be greater than zero.`
  return null
}

/** Allows one decimal point, for values such as a face value of 2.50. */
export function validateDecimal(value: string, label: string) {
  const trimmed = value.trim()
  if (!trimmed) return `${label} is required.`
  if (!/^\d+(\.\d{1,4})?$/.test(trimmed)) return `Enter ${label.toLowerCase()} as a number.`
  if (Number(trimmed) <= 0) return `${label} must be greater than zero.`
  return null
}

/** Keeps a decimal entry to digits and a single point. */
export function normalizeDecimal(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "")
  const [whole, ...rest] = cleaned.split(".")
  return rest.length === 0 ? whole : `${whole}.${rest.join("").slice(0, 4)}`
}

export function normalizeCin(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 21)
}

export function normalizeDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength)
}
