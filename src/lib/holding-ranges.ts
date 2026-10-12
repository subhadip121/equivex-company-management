/** Bands are held as text while editing, so a field can be cleared. */
export interface RangeDraft {
  from: string
  to: string
}

/** Nine rows in total: the full span, then blanks ready to be filled in. */
const BLANK_ROWS = 8

/** The open upper bound every schedule ends on. */
export const MAX_HOLDING = "999999999"

/** Opens as the full span; the user narrows it into bands from there. */
export const DEFAULT_RANGES: RangeDraft[] = [
  { from: "1", to: MAX_HOLDING },
  ...Array.from({ length: BLANK_ROWS }, () => ({ from: "", to: "" })),
]

export function isBlankRange(range: RangeDraft) {
  return !range.from.trim() && !range.to.trim()
}

/** Only completed rows are sent; empty ones are placeholders. */
export function toHoldingRanges(ranges: RangeDraft[]) {
  return ranges
    .filter((range) => !isBlankRange(range))
    .map((range) => ({ from: Number(range.from), to: Number(range.to) }))
}

/** Returns an error to show, or null when every filled band is usable. */
export function validateRanges(ranges: RangeDraft[]) {
  const filled = ranges.filter((range) => !isBlankRange(range))
  if (filled.length === 0) return "Enter at least one share holding range."

  for (const [index, range] of ranges.entries()) {
    if (isBlankRange(range)) continue

    const from = Number(range.from)
    const to = Number(range.to)

    if (!range.from.trim() || !range.to.trim()) {
      return `Fill in both ends of range ${index + 1}.`
    }
    if (from < 1) return `Range ${index + 1} must start at 1 or above.`
    if (to < from) return `Range ${index + 1} ends before it starts.`
  }

  return null
}
