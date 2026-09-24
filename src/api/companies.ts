import { endpoints } from "@/api/endpoints"
import { download, http, upload } from "@/api/http"
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
/**
 * Pagination metadata, wherever the backend chose to put it. Django REST
 * Framework's default is { count, next, previous, results }; custom
 * paginators often add total_pages/current_page or nest the lot under
 * `pagination` or `meta`.
 */
interface PageMeta {
  count?: number
  total?: number
  total_records?: number
  total_count?: number
  total_pages?: number
  num_pages?: number
  last_page?: number
  current_page?: number
  page?: number
  page_size?: number
  per_page?: number
  next?: unknown
  previous?: unknown
  results?: Company[]
  data?: Company[]
  items?: Company[]
}

interface CompanyListResponse extends Omit<PageMeta, "data"> {
  data?: Company[] | (PageMeta & { results?: Company[] })
  pagination?: PageMeta
  meta?: PageMeta
}

function firstNumber(...values: Array<number | undefined>) {
  return values.find((value) => typeof value === "number" && Number.isFinite(value))
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
  // Metadata may sit at the top level or in any of these wrappers.
  const sources: PageMeta[] = [response, response.pagination, response.meta, nested].filter(
    Boolean,
  ) as PageMeta[]

  const items =
    response.results ??
    (Array.isArray(response.data) ? response.data : undefined) ??
    nested?.results ??
    nested?.data ??
    response.items ??
    nested?.items ??
    []

  const total =
    firstNumber(
      ...sources.flatMap((source) => [
        source.count,
        source.total,
        source.total_records,
        source.total_count,
      ]),
    ) ?? items.length

  const effectivePageSize =
    firstNumber(...sources.flatMap((source) => [source.page_size, source.per_page])) ?? pageSize

  const currentPage =
    firstNumber(...sources.flatMap((source) => [source.current_page, source.page])) ?? page

  const reportedPages = firstNumber(
    ...sources.flatMap((source) => [source.total_pages, source.num_pages, source.last_page]),
  )

  // With no count and no page total, a `next` link is the only proof that
  // another page exists.
  const hasNext = sources.some((source) => Boolean(source.next))
  const derivedPages = Math.max(1, Math.ceil(total / (effectivePageSize || pageSize)))

  return {
    items,
    total,
    page: currentPage,
    pageSize: effectivePageSize || pageSize,
    totalPages: reportedPages ?? (hasNext ? Math.max(derivedPages, currentPage + 1) : derivedPages),
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

/**
 * Result of a bulk upload. The backend's response shape is unconfirmed, so
 * every field is optional and the dialog shows whatever arrives.
 */
export interface BulkUploadResult {
  message?: string
  created?: number
  failed?: number
  errors?: string[]
}

interface BulkUploadResponse {
  status?: boolean | string
  message?: string
  created?: number
  success_count?: number
  inserted?: number
  failed?: number
  failed_count?: number
  error_count?: number
  errors?: unknown
  data?: { created?: number; failed?: number; errors?: unknown; message?: string }
}

function describe(value: unknown): string {
  if (typeof value === "string") return value
  if (Array.isArray(value)) return value.map(describe).join(", ")
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>
    const label = row.row ?? row.line ?? row.index
    const reason = row.message ?? row.error ?? row.detail ?? row.errors
    if (reason !== undefined) {
      return label === undefined ? describe(reason) : `Row ${label}: ${describe(reason)}`
    }
    // A field-keyed map, e.g. { company_isin: ["already exists"] }.
    return Object.entries(row)
      .map(([key, entry]) => `${key}: ${describe(entry)}`)
      .join(" · ")
  }
  return String(value)
}

/**
 * Flattens whatever the backend calls its per-row errors into lines. The
 * shape varies: a list of strings, a list of row objects, or a map keyed by
 * row number or field name.
 */
function toErrorList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(describe).filter(Boolean)
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => `${key}: ${describe(entry)}`)
      .filter(Boolean)
  }
  return [String(value)]
}

/**
 * Per-row reasons a rejected bulk upload came back with. Specific to the
 * bulk upload endpoint, which answers a failure with { message, errors }.
 */
export function bulkUploadErrorList(error: unknown): string[] {
  if (!(error instanceof ApiError) || !error.details) return []
  const body = error.details as { errors?: unknown; data?: { errors?: unknown } }
  return toErrorList(body.errors ?? body.data?.errors)
}

/**
 * Sends the spreadsheet as multipart form data under the field name "file".
 * Rename that key here if the backend expects a different one.
 */
export async function bulkUploadCompanies(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<BulkUploadResult> {
  const form = new FormData()
  form.append("file", file)

  const response = await upload<BulkUploadResponse>(endpoints.admin.bulkCompanyUpload, form, {
    onProgress,
  })

  if (response.status === false || response.status === "false") {
    throw new ApiError(response.message ?? "The upload could not be processed.", 400)
  }

  const nested = response.data ?? {}
  return {
    message: response.message ?? nested.message,
    created: response.created ?? response.success_count ?? response.inserted ?? nested.created,
    failed: response.failed ?? response.failed_count ?? response.error_count ?? nested.failed,
    errors: toErrorList(response.errors ?? nested.errors),
  }
}

/** Downloads the spreadsheet showing the columns a bulk upload expects. */
export function downloadBulkUploadTemplate(): Promise<void> {
  return download(endpoints.admin.bulkUploadTemplate, "bulk-company-upload-sample.xlsx")
}
