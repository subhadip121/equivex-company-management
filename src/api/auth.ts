import { endpoints } from "@/api/endpoints"
import { http, setAuthToken } from "@/api/http"
import { ApiError } from "@/lib/api-error"
import { normalizeIsin } from "@/lib/isin"
import type {
  AdminCredentials,
  AdminProfile,
  ChangePasswordPayload,
  CompanyCredentials,
  CompanyProfile,
  Session,
} from "@/types"

/**
 * Response shapes are not confirmed yet, so these cover the variants a
 * DRF-style backend commonly returns. Narrow them once a live response
 * is available.
 */
interface AccountDetails {
  token?: string
  access?: string
  id?: number
  user_name?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  company_name?: string
  company_isin?: string
  email?: string
  mobile?: string
  status?: string
}

interface LoginResponse {
  token?: string
  key?: string
  access?: string
  access_token?: string
  message?: string
  status?: boolean | string
  data?: AccountDetails
  user?: AccountDetails
  company?: AccountDetails
}

function extractToken(response: LoginResponse): string | null {
  return (
    response.token ??
    response.key ??
    response.access ??
    response.access_token ??
    response.data?.token ??
    response.data?.access ??
    null
  )
}

/** A 200 carrying a failure flag is treated the same as a 401. */
function assertSuccess(response: LoginResponse, fallback: string) {
  if (response.status === false || response.status === "false") {
    throw new ApiError(response.message ?? fallback, 401)
  }
}

function joinName(parts: Array<string | undefined>, fallback: string) {
  const name = parts.filter(Boolean).join(" ").trim()
  return name || fallback
}

/** Unwraps `{ data: T }` envelopes, and passes a bare `T` straight through. */
function unwrap<T>(response: T | { data: T }): T {
  return response && typeof response === "object" && "data" in response
    ? (response as { data: T }).data
    : (response as T)
}

export async function loginAdmin({ username, password }: AdminCredentials): Promise<Session> {
  const response = await http<LoginResponse>(endpoints.admin.login, {
    method: "POST",
    body: JSON.stringify({ user_name: username.trim(), password }),
  })

  assertSuccess(response, "Incorrect username or password.")

  const token = extractToken(response)
  setAuthToken(token)

  const details: AccountDetails = response.data ?? response.user ?? {}

  return {
    token,
    user: {
      id: String(details.id ?? "admin"),
      role: "admin",
      username: details.user_name ?? username.trim(),
      email: details.email ?? "",
      name: joinName(
        [details.first_name, details.middle_name, details.last_name],
        details.user_name ?? username.trim(),
      ),
    },
  }
}

export async function loginCompany({ isin, password }: CompanyCredentials): Promise<Session> {
  const normalized = normalizeIsin(isin)

  const response = await http<LoginResponse>(endpoints.company.login, {
    method: "POST",
    body: JSON.stringify({ company_isin: normalized, password }),
  })

  assertSuccess(response, "Incorrect ISIN number or password.")

  const token = extractToken(response)
  setAuthToken(token)

  const details: AccountDetails = response.data ?? response.company ?? response.user ?? {}

  return {
    token,
    user: {
      id: String(details.id ?? normalized),
      role: "company",
      isin: details.company_isin ?? normalized,
      email: details.email ?? "",
      name: details.company_name ?? normalized,
      status: (details.status as "active" | "suspended" | "pending") ?? "active",
    },
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    await http<unknown>(endpoints.admin.logout, { method: "POST" })
  } finally {
    setAuthToken(null)
  }
}

export async function logoutCompany(): Promise<void> {
  try {
    await http<unknown>(endpoints.company.logout, { method: "POST" })
  } finally {
    setAuthToken(null)
  }
}

export async function fetchAdminProfile(): Promise<AdminProfile> {
  return unwrap(await http<AdminProfile | { data: AdminProfile }>(endpoints.admin.profile))
}

export async function updateAdminProfile(profile: AdminProfile): Promise<AdminProfile> {
  return unwrap(
    await http<AdminProfile | { data: AdminProfile }>(endpoints.admin.updateProfile, {
      method: "POST",
      body: JSON.stringify(profile),
    }),
  )
}

export async function fetchCompanyProfile(): Promise<CompanyProfile> {
  return unwrap(await http<CompanyProfile | { data: CompanyProfile }>(endpoints.company.profile))
}

export async function changeCompanyPassword(payload: ChangePasswordPayload): Promise<void> {
  const response = await http<LoginResponse>(endpoints.company.changePassword, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  assertSuccess(response, "Could not change the password.")
}
