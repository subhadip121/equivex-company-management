/** Indian digit grouping, since these are Indian securities figures. */
const numberFormat = new Intl.NumberFormat("en-IN")

export function formatNumber(value: number) {
  return numberFormat.format(value)
}

export function formatPercent(value: number) {
  return `${value.toFixed(2)}%`
}

/** company_name -> Company name, lastLogin -> Last login */
export function humaniseKey(key: string) {
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

/** Accepts the numbers and numeric strings the API mixes together. */
export function toNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Renders a timestamp as a readable local date and time. Anything that is
 * not a recognisable date is returned unchanged.
 */
export function formatDateTime(value: unknown) {
  if (value === null || value === undefined || value === "") return null

  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return String(value)

  return parsed.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
