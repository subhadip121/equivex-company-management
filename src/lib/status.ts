/**
 * Backends spell status in several ways: a boolean, 1/0, or a word like
 * "active". This turns any of them into something safe to render.
 */
export interface StatusDisplay {
  label: string
  isActive: boolean
}

const INACTIVE_WORDS = new Set(["inactive", "suspended", "disabled", "blocked", "pending", "false", "0"])

export function toStatus(value: unknown): StatusDisplay {
  if (value === null || value === undefined || value === "") {
    return { label: "Unknown", isActive: false }
  }

  if (typeof value === "boolean") {
    return { label: value ? "Active" : "Inactive", isActive: value }
  }

  if (typeof value === "number") {
    return { label: value === 1 ? "Active" : "Inactive", isActive: value === 1 }
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    const isActive = !INACTIVE_WORDS.has(normalized)
    // Show the backend's own wording, just capitalised.
    return { label: value.charAt(0).toUpperCase() + value.slice(1), isActive }
  }

  return { label: String(value), isActive: false }
}
