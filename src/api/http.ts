import { ApiError } from "@/lib/api-error"

/** Trailing slashes are stripped so `${BASE_URL}${path}` never doubles up. */
const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "")

let authToken: string | null = null

/**
 * Called once when the server rejects a request from a signed-in user, so
 * the app can end the session. Registered by the app, not by this module,
 * to keep the API layer free of store and router imports.
 */
let onSessionExpired: (() => void) | null = null
let sessionExpiryReported = false

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler
}

/** Set after login so subsequent requests carry the credential. */
export function setAuthToken(token: string | null) {
  authToken = token
  // A fresh token means the next rejection is a new event worth reporting.
  sessionExpiryReported = false
}

/**
 * This backend is Django REST Framework, which answers a missing or bad
 * credential with 403 and a `detail` string, not 401. A 403 can also mean
 * a valid user lacking permission, so the wording decides: only
 * authentication failures end the session.
 */
const AUTH_FAILURE_PHRASES = [
  "authentication credentials were not provided",
  "invalid token",
  "token has expired",
  "token expired",
  "expired",
  "not valid for any token type",
  "invalid or expired",
  "signature has expired",
]

function isAuthFailure(status: number, body: unknown) {
  if (status === 401) return true
  if (status !== 403) return false

  const detail = (body ?? {}) as { detail?: unknown; message?: unknown }
  const text = `${detail.detail ?? ""} ${detail.message ?? ""}`.toLowerCase()
  if (!text.trim()) return false
  return AUTH_FAILURE_PHRASES.some((phrase) => text.includes(phrase))
}

/**
 * Reports a rejected credential while a token is held. The same rejection
 * without a token is just a failed sign-in, so it passes through. Parallel
 * requests can fail together, so this reports only the first.
 */
function reportSessionExpiry(status: number, body?: unknown) {
  if (!authToken || sessionExpiryReported) return
  if (!isAuthFailure(status, body)) return
  sessionExpiryReported = true
  onSessionExpired?.()
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
  // FormData must set its own Content-Type: the browser adds the multipart
  // boundary, and overriding it makes the body unparseable on the server.
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData
  if (!headers.has("Content-Type") && init?.body && !isFormData) {
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
    let details: unknown
    try {
      details = await response.json()
      const body = (details ?? {}) as { message?: string; detail?: string }
      message = body.message ?? body.detail ?? message
    } catch {
      // response had no JSON body; keep the status text
    }
    reportSessionExpiry(response.status, details)
    throw new ApiError(message, response.status, details)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** Simulated latency for the mock endpoints. Delete with the mocks. */
export function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

/**
 * Multipart upload with progress. fetch cannot report bytes sent, so this
 * uses XMLHttpRequest. Auth, error shapes and session expiry behave the
 * same as `http`.
 */
export function upload<T>(
  path: string,
  form: FormData,
  options: { onProgress?: (percent: number) => void; method?: string } = {},
): Promise<T> {
  const { onProgress, method = "POST" } = options

  return new Promise<T>((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open(method, `${BASE_URL}${path}`)
    request.setRequestHeader("Accept", "application/json")
    if (authToken) {
      request.setRequestHeader("Authorization", `Bearer ${authToken}`)
    }
    // Content-Type is deliberately left unset so the browser adds the
    // multipart boundary.

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      onProgress?.(Math.round((event.loaded / event.total) * 100))
    }

    request.onload = () => {
      const raw = request.responseText
      let body: unknown = null
      try {
        body = raw ? JSON.parse(raw) : null
      } catch {
        // response was not JSON; handled below
      }

      if (request.status >= 200 && request.status < 300) {
        resolve(body as T)
        return
      }

      const parsed = (body ?? {}) as { message?: string; detail?: string }
      reportSessionExpiry(request.status, body)
      reject(
        new ApiError(
          parsed.message ?? parsed.detail ?? request.statusText,
          request.status,
          body,
        ),
      )
    }

    request.onerror = () =>
      reject(new ApiError("Could not reach the server. Check your connection.", 0))
    request.onabort = () => reject(new ApiError("The upload was cancelled.", 0))
    request.ontimeout = () => reject(new ApiError("The upload timed out.", 0))

    request.send(form)
  })
}

/** Pulls a filename out of a Content-Disposition header, if it has one. */
function filenameFrom(header: string | null) {
  if (!header) return null
  const encoded = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header)
  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1].replace(/["']/g, "").trim())
    } catch {
      // fall through to the plain filename
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain?.[1]?.trim() ?? null
}

/**
 * Downloads a file the user is authorised to fetch. A plain link cannot be
 * used because the credential lives in memory, not in a cookie, so the file
 * is fetched with the auth header and handed to the browser as a blob.
 */
export async function download(path: string, fallbackFilename: string): Promise<void> {
  const headers = new Headers()
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`)
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { headers })
  } catch {
    throw new ApiError("Could not reach the server. Check your connection.", 0)
  }

  if (!response.ok) {
    let message = response.statusText || "Download failed."
    let details: unknown
    try {
      details = await response.json()
      const body = (details ?? {}) as { message?: string; detail?: string }
      message = body.message ?? body.detail ?? message
    } catch {
      // not a JSON error body; keep the status text
    }
    reportSessionExpiry(response.status, details)
    throw new ApiError(message, response.status, details)
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = objectUrl
  link.download = filenameFrom(response.headers.get("Content-Disposition")) ?? fallbackFilename
  document.body.append(link)
  link.click()
  link.remove()
  // Revoking immediately can cancel the save in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
}
