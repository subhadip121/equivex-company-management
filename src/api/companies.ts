import { endpoints } from "@/api/endpoints"
import { http } from "@/api/http"
import { ApiError } from "@/lib/api-error"
import type {
  Company,
  CreateCompanyPayload,
  Paginated,
  UpdateCompanyPayload,
} from "@/types"

interface CreateCompanyResponse {
  id?: number
  message?: string
  status?: boolean | string
  data?: { id?: number }
}

export async function createCompany(payload: CreateCompanyPayload): Promise<{ id?: number }> {
  const response = await http<CreateCompanyResponse>(endpoints.admin.createCompany, {
    method: "POST",
    body: JSON.stringify(payload),
  })

  // Some backends answer 200 with a failure flag rather than a 4xx.
  if (response.status === false || response.status === "false") {
    throw new ApiError(response.message ?? "Could not create the company.", 400)
  }

  return { id: response.id ?? response.data?.id }
}

/**
 * The list response shape is not confirmed, so this accepts the common
 * paginated envelopes: a DRF `{ count, results }`, a `{ data, total }`
 * wrapper, or a bare array. Narrow it once a live response is available.
 */
interface CompanyListResponse {
  count?: number
  total?: number
  total_records?: number
  total_pages?: number
  results?: Company[]
  data?: Company[] | { results?: Company[]; count?: number; total?: number }
}

function firstNumber(...values: Array<number | undefined>) {
  return values.find((value) => typeof value === "number")
}

function normalizeList(
  response: CompanyListResponse | Company[],
  page: number,
  pageSize: number,
): Paginated<Company> {
  if (Array.isArray(response)) {
    // No envelope: the whole set arrived, so page it here.
    const start = (page - 1) * pageSize
    return {
      items: response.slice(start, start + pageSize),
      total: response.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(response.length / pageSize)),
    }
  }

  const nested = Array.isArray(response.data) ? undefined : response.data
  const items = response.results ?? (Array.isArray(response.data) ? response.data : nested?.results) ?? []
  const total =
    firstNumber(
      response.count,
      response.total,
      response.total_records,
      nested?.count,
      nested?.total,
    ) ?? items.length

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: response.total_pages ?? Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function fetchCompanyList(
  page: number,
  pageSize: number,
): Promise<Paginated<Company>> {
  const query = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  const response = await http<CompanyListResponse | Company[]>(
    `${endpoints.admin.companyList}?${query.toString()}`,
  )
  return normalizeList(response, page, pageSize)
}

/** Shared envelope check: a 200 carrying a failure flag is still a failure. */
function assertOk(response: { status?: boolean | string; message?: string }, fallback: string) {
  if (response.status === false || response.status === "false") {
    throw new ApiError(response.message ?? fallback, 400)
  }
}

export async function fetchCompanyById(id: number | string): Promise<Company> {
  const response = await http<Company | { data: Company }>(endpoints.admin.companyById(id))
  return response && typeof response === "object" && "data" in response
    ? (response as { data: Company }).data
    : (response as Company)
}

export async function updateCompany(
  id: number | string,
  payload: UpdateCompanyPayload,
): Promise<void> {
  const response = await http<{ status?: boolean | string; message?: string }>(
    endpoints.admin.updateCompany(id),
    { method: "POST", body: JSON.stringify(payload) },
  )
  assertOk(response, "Could not update the company.")
}

/** `active` is sent as the 1/0 flag the endpoint expects. */
export async function changeCompanyStatus(id: number | string, active: boolean): Promise<void> {
  const response = await http<{ status?: boolean | string; message?: string }>(
    endpoints.admin.changeCompanyStatus(id),
    { method: "POST", body: JSON.stringify({ status: active ? 1 : 0 }) },
  )
  assertOk(response, "Could not change the company status.")
}

export async function changeCompanyPassword(
  id: number | string,
  newPassword: string,
): Promise<void> {
  const response = await http<{ status?: boolean | string; message?: string }>(
    endpoints.admin.changeCompanyPassword(id),
    { method: "POST", body: JSON.stringify({ new_password: newPassword }) },
  )
  assertOk(response, "Could not change the password.")
}
