import { ApiError } from "@/lib/api-error"

/** Trailing slashes are stripped so `${BASE_URL}${path}` never doubles up. */
const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "")

let authToken: string | null = null

/** Set after login so subsequent requests carry the credential. */
export function setAuthToken(token: string | null) {
  authToken = token
}

export function getAuthToken() {
  return authToken
}

/**
 * Thin fetch wrapper. Every real endpoint should go through this so error
 * handling, auth headers and JSON parsing stay in one place.
 */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json")
  }
  headers.set("Accept", "application/json")
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`)
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError("Could not reach the server. Check your connection.", 0)
  }

  if (!response.ok) {
    let message = response.statusText || "Request failed."
    try {
      const body = (await response.json()) as { message?: string; detail?: string }
      message = body.message ?? body.detail ?? message
    } catch {
      // response had no JSON body; keep the status text
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** Simulated latency for the mock endpoints. Delete with the mocks. */
export function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}
