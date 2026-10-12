import { endpoints } from "@/api/endpoints"
import { download, http } from "@/api/http"

/** A filter choice, normalised from whatever the lookup endpoint returns. */
export interface FilterOption {
  value: string
  label: string
}

export interface ConsolidatedReportRequest {
  companyId: number
  date: string
  categories: string[]
}

/** Rows are rendered from their own keys, so the shape stays open. */
export type ReportRow = Record<string, unknown>

/** One category line of the consolidated shareholding report. */
export interface ConsolidatedShareholdingRow {
  /** Category code, e.g. A1C. Named `status` on the wire. */
  code: string
  name: string
  cases: number
  holding: number
  /** Sent as a string, e.g. "0.08". */
  percentage: number
}

export interface ConsolidatedShareholdingReport {
  shareCapital: number
  totalCases: number
  totalHolding: number
  totalPercentage: number
  rows: ConsolidatedShareholdingRow[]
}

function unwrapList(response: unknown): unknown[] {
  if (Array.isArray(response)) return response
  if (response && typeof response === "object") {
    const body = response as Record<string, unknown>
    for (const key of ["data", "results", "categories", "dates", "category", "date"]) {
      const value = body[key]
      if (Array.isArray(value)) return value
    }
  }
  return []
}

/**
 * Accepts a list of plain strings, or of objects using any of the usual
 * key names, and reduces each entry to a value and a label.
 */
function toOptions(response: unknown, valueKeys: string[], labelKeys: string[]): FilterOption[] {
  return unwrapList(response)
    .map((entry) => {
      if (entry === null || entry === undefined) return null
      if (typeof entry === "string" || typeof entry === "number") {
        return { value: String(entry), label: String(entry) }
      }
      if (typeof entry !== "object") return null

      const row = entry as Record<string, unknown>
      const rawValue = valueKeys.map((key) => row[key]).find((value) => value != null)
      const rawLabel = labelKeys.map((key) => row[key]).find((value) => value != null)
      if (rawValue == null && rawLabel == null) return null

      const value = String(rawValue ?? rawLabel)
      return { value, label: String(rawLabel ?? rawValue) }
    })
    .filter((option): option is FilterOption => option !== null)
}

export interface CategoryOption extends FilterOption {
  group: string
}

export interface CategoryGroup {
  label: string
  options: CategoryOption[]
}

function withoutGroup(option: FilterOption): CategoryOption {
  return { ...option, group: "Categories" }
}

/**
 * Categories arrive grouped:
 * { data: { "Promoter & Group": { A1A: "Individuals/HUF", ... }, ... } }
 * A flat list is still accepted, in case another endpoint reuses this.
 */
function toCategoryGroups(response: unknown): CategoryGroup[] {
  const body = (response ?? {}) as Record<string, unknown>
  const data = (body.data ?? body) as unknown

  if (Array.isArray(data)) {
    const flat = toOptions(
      data,
      ["category_code", "category", "code", "value", "id"],
      ["category_name", "name", "label", "description", "category", "category_code"],
    )
    return flat.length === 0 ? [] : [{ label: "Categories", options: flat.map(withoutGroup) }]
  }

  if (!data || typeof data !== "object") return []

  return Object.entries(data as Record<string, unknown>)
    .map(([groupLabel, members]) => ({
      label: groupLabel,
      options:
        members && typeof members === "object" && !Array.isArray(members)
          ? Object.entries(members as Record<string, unknown>).map(([code, label]) => ({
              value: code,
              label: String(label ?? code),
              group: groupLabel,
            }))
          : [],
    }))
    .filter((group) => group.options.length > 0)
}

export async function fetchReportCategories(): Promise<CategoryGroup[]> {
  return toCategoryGroups(await http<unknown>(endpoints.company.reportCategories))
}

export function flattenCategories(groups: CategoryGroup[]): CategoryOption[] {
  return groups.flatMap((group) => group.options)
}

/**
 * 2026-07-17 or 2026-07-17T00:00:00Z becomes 17-07-2026. Parsed by hand
 * rather than through Date, which would shift the day across time zones.
 * Anything unrecognised is shown as sent.
 */
function toDisplayDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (!match) return value
  const [, year, month, day] = match
  return `${day}-${month}-${year}`
}

/**
 * Normalises any date or timestamp string to "YYYY-MM-DD"
 * e.g. "2026-07-24T00:00:00" -> "2026-07-24"
 */
export function toYmdDate(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`
  return trimmed
}

export async function fetchReportDates(): Promise<FilterOption[]> {
  const response = await http<unknown>(endpoints.company.reportDates)
  const options = toOptions(
    response,
    ["upload_date", "uplod_date", "inserted_date", "insert_date", "date", "value"],
    ["upload_date", "uplod_date", "inserted_date", "insert_date", "date", "label"],
  )

  // The value stays exactly as the API sent it, since it goes back in the
  // report payload; only the label is reformatted.
  return options.map((option) => ({ ...option, label: toDisplayDate(option.label) }))
}

function toPayload({ companyId, date, categories }: ConsolidatedReportRequest) {
  return { company_id: companyId, upload_date: toYmdDate(date), category: categories }
}

/** Percentages arrive as strings, and any field may be missing. */
function toNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

interface ConsolidatedResponseRow {
  status?: string
  cat_name?: string
  cases?: unknown
  holding?: unknown
  percentage?: unknown
}

export async function fetchConsolidatedShareholding(
  request: ConsolidatedReportRequest,
): Promise<ConsolidatedShareholdingReport> {
  const response = await http<unknown>(endpoints.company.consolidatedShareholding, {
    method: "POST",
    body: JSON.stringify(toPayload(request)),
  })

  const body = (response ?? {}) as Record<string, unknown>
  // Totals sit beside the rows, not inside them.
  const source = (Array.isArray(body.report) ? body : ((body.data ?? body) as Record<string, unknown>))
  const rawRows = Array.isArray(source.report) ? source.report : unwrapList(source)

  return {
    shareCapital: toNumber(source.share_capital),
    totalCases: toNumber(source.total_cases),
    totalHolding: toNumber(source.total_holding),
    totalPercentage: toNumber(source.total_percentage),
    rows: (rawRows as ConsolidatedResponseRow[]).map((row) => ({
      code: String(row.status ?? ""),
      name: String(row.cat_name ?? row.status ?? ""),
      cases: toNumber(row.cases),
      holding: toNumber(row.holding),
      percentage: toNumber(row.percentage),
    })),
  }
}

export function downloadConsolidatedShareholdingExcel(request: ConsolidatedReportRequest) {
  return download(
    endpoints.company.consolidatedShareholdingExcel,
    `consolidated-shareholding-${request.date}.xlsx`,
    { method: "POST", body: toPayload(request) },
  )
}

export function downloadConsolidatedShareholdingPdf(request: ConsolidatedReportRequest) {
  return download(
    endpoints.company.consolidatedShareholdingPdf,
    `consolidated-shareholding-${request.date}.pdf`,
    { method: "POST", body: toPayload(request) },
  )
}

export interface CapitalAnalysisRequest {
  companyId: number
  date: string
}

export interface CapitalAnalysisRow {
  category: string
  totHolders: number
  totShares: number
  equity: number
  holderPercentage: number
}

export interface CapitalAnalysisTotals {
  totalHolders: number
  totalShares: number
  totalEquity: number
  holderPercentage: number
}

export interface CapitalAnalysisReport {
  uploadDate: string
  shareCapital: number
  summary: CapitalAnalysisRow[]
  total: CapitalAnalysisTotals
}

function toCapitalAnalysisPayload({ companyId, date }: CapitalAnalysisRequest) {
  return {
    company_id: companyId,
    upload_date: toYmdDate(date),
  }
}

export async function fetchCapitalAnalysis(
  request: CapitalAnalysisRequest,
): Promise<CapitalAnalysisReport> {
  const response = await http<unknown>(endpoints.company.capitalAnalysis, {
    method: "POST",
    body: JSON.stringify(toCapitalAnalysisPayload(request)),
  })

  const body = (response ?? {}) as Record<string, unknown>
  const summaryRaw = Array.isArray(body.summary)
    ? (body.summary as Record<string, unknown>[])
    : []
  const totalRaw = (body.total ?? {}) as Record<string, unknown>

  const summary: CapitalAnalysisRow[] = summaryRaw.map((item) => ({
    category: String(item.category ?? item.name ?? ""),
    totHolders: toNumber(item.tot_holders ?? item.holders ?? item.cases),
    totShares: toNumber(item.tot_shares ?? item.shares ?? item.holding),
    equity: toNumber(item.equity ?? item.percentage),
    holderPercentage: toNumber(item.holder_percentage),
  }))

  const sumHolders = summary.reduce((acc, r) => acc + r.totHolders, 0)
  const sumShares = summary.reduce((acc, r) => acc + r.totShares, 0)
  const sumEquity = summary.reduce((acc, r) => acc + r.equity, 0)

  const total: CapitalAnalysisTotals = {
    totalHolders: toNumber(totalRaw.total_holders ?? sumHolders),
    totalShares: toNumber(totalRaw.total_shares ?? sumShares),
    totalEquity: toNumber(totalRaw.total_equity ?? sumEquity),
    holderPercentage: toNumber(totalRaw.holder_percentage ?? 100),
  }

  return {
    uploadDate: String(body.upload_date ?? request.date),
    shareCapital: toNumber(body.share_capital),
    summary,
    total,
  }
}

export function downloadCapitalAnalysisExcel(request: CapitalAnalysisRequest) {
  return download(
    endpoints.company.capitalAnalysisExcel,
    `summary-of-shareholding-${request.date}.xlsx`,
    { method: "POST", body: toCapitalAnalysisPayload(request) },
  )
}

export function downloadCapitalAnalysisPdf(request: CapitalAnalysisRequest) {
  return download(
    endpoints.company.capitalAnalysisPdf,
    `summary-of-shareholding-${request.date}.pdf`,
    { method: "POST", body: toCapitalAnalysisPayload(request) },
  )
}

// ---------------------------------------------------------------------------
// Top Shareholders Report
// ---------------------------------------------------------------------------

export interface TopShareholdersRequest {
  companyId: number
  date: string
  range: number
  page: number
  pageSize: number
}

export interface TopShareholderRow {
  folioId: string
  dpId: string
  clientId: string
  pan: string
  userName: string
  categoryCode: string
  categoryName: string
  presentHolding: number
  presentHoldingPercentage: number
}

export interface PaginationMeta {
  page: number
  pageSize: number
  totalRecords: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface TopShareholdersReport {
  currentDate: string
  shareCapital: number
  topN: number
  rows: TopShareholderRow[]
  pagination: PaginationMeta
}

interface TopShareholdersRawResponse {
  current_date?: string
  share_capital?: unknown
  top_n?: unknown
  data?: Array<{
    folio_id?: string
    dp_id?: string
    client_id?: string
    pan?: string
    user_name?: string
    category_code?: string
    category_name?: string
    present_holding?: unknown
    present_holding_percentage?: unknown
  }>
  pagination?: {
    page?: unknown
    page_size?: unknown
    total_records?: unknown
    total_pages?: unknown
    has_next?: boolean
    has_previous?: boolean
  }
}

function toTopShareholdersPayload(request: TopShareholdersRequest) {
  return {
    company_id: request.companyId,
    current_date: toYmdDate(request.date),
    range: request.range,
    page: request.page,
    page_size: request.pageSize,
  }
}

export async function fetchTopShareholders(
  request: TopShareholdersRequest,
): Promise<TopShareholdersReport> {
  const response = await http<TopShareholdersRawResponse>(
    endpoints.company.topShareholders,
    {
      method: "POST",
      body: JSON.stringify(toTopShareholdersPayload(request)),
    },
  )

  const rows: TopShareholderRow[] = (response.data ?? []).map((item) => ({
    folioId: String(item.folio_id ?? ""),
    dpId: String(item.dp_id ?? ""),
    clientId: String(item.client_id ?? ""),
    pan: String(item.pan ?? ""),
    userName: String(item.user_name ?? ""),
    categoryCode: String(item.category_code ?? ""),
    categoryName: String(item.category_name ?? ""),
    presentHolding: toNumber(item.present_holding),
    presentHoldingPercentage: toNumber(item.present_holding_percentage),
  }))

  const pag = response.pagination ?? {}
  const page = toNumber(pag.page) || request.page
  const pageSize = toNumber(pag.page_size) || request.pageSize
  const totalRecords = toNumber(pag.total_records) || rows.length
  const totalPages =
    toNumber(pag.total_pages) ||
    (pageSize > 0 ? Math.ceil(totalRecords / pageSize) : 1)

  return {
    currentDate: String(response.current_date ?? request.date),
    shareCapital: toNumber(response.share_capital),
    topN: toNumber(response.top_n) || request.range,
    rows,
    pagination: {
      page,
      pageSize,
      totalRecords,
      totalPages,
      hasNext: Boolean(pag.has_next),
      hasPrevious: Boolean(pag.has_previous),
    },
  }
}

export function downloadTopShareholdersExcel(request: TopShareholdersRequest) {
  return download(
    endpoints.company.topShareholdersExcel,
    `top-${request.range}-shareholders-${request.date}.xlsx`,
    {
      method: "POST",
      body: {
        company_id: request.companyId,
        current_date: toYmdDate(request.date),
        range: request.range,
        page_size: request.pageSize,
      },
    },
  )
}

export function downloadTopShareholdersPdf(request: TopShareholdersRequest) {
  return download(
    endpoints.company.topShareholdersPdf,
    `top-${request.range}-shareholders-${request.date}.pdf`,
    {
      method: "POST",
      body: {
        company_id: request.companyId,
        current_date: toYmdDate(request.date),
        range: request.range,
        page_size: request.pageSize,
      },
    },
  )
}

// ---------------------------------------------------------------------------
// 1% and Above Shareholders Report
// ---------------------------------------------------------------------------

export interface OnePercentShareholdersRequest {
  companyId: number
  date: string
  page: number
  pageSize: number
}

export interface OnePercentShareholderRow {
  folioId: string
  dpId: string
  clientId: string
  pan: string
  userName: string
  categoryCode: string
  categoryName: string
  totalPan1: number
  previousHolding: number
  presentHolding: number
  buying: number
  selling: number
  presentHoldingPercentage: number
}

export interface OnePercentTotals {
  totalRecords: number
  totalPreviousHolding: number
  totalBuying: number
  totalSelling: number
  totalPresentHolding: number
  totalEquity: number
}

export interface OnePercentShareholdersReport {
  currentDate: string
  previousDate: string
  shareCapital: number
  totals: OnePercentTotals
  rows: OnePercentShareholderRow[]
  pagination: PaginationMeta
}

interface OnePercentRawResponse {
  current_date?: string
  previous_date?: string
  share_capital?: unknown
  total_records?: unknown
  total_previous_holding?: unknown
  total_buying?: unknown
  total_selling?: unknown
  total_present_holding?: unknown
  total_equlty?: unknown
  total_equity?: unknown
  data?: Array<{
    folio_id?: string
    dp_id?: string
    client_id?: string
    pan?: string
    user_name?: string
    category_code?: string
    category_name?: string
    total_pan1?: unknown
    previous_holding?: unknown
    present_holding?: unknown
    buying?: unknown
    selling?: unknown
    present_holding_percentage?: unknown
  }>
  pagination?: {
    page?: unknown
    page_size?: unknown
    total_records?: unknown
    total_pages?: unknown
    has_next?: boolean
    has_previous?: boolean
  }
}

function toOnePercentPayload(request: OnePercentShareholdersRequest) {
  return {
    company_id: request.companyId,
    current_date: toYmdDate(request.date),
    page: request.page,
    page_size: request.pageSize,
  }
}

export async function fetchOnePercentShareholders(
  request: OnePercentShareholdersRequest,
): Promise<OnePercentShareholdersReport> {
  const response = await http<OnePercentRawResponse>(
    endpoints.company.onePercentShareholders,
    {
      method: "POST",
      body: JSON.stringify(toOnePercentPayload(request)),
    },
  )

  const rows: OnePercentShareholderRow[] = (response.data ?? []).map((item) => ({
    folioId: String(item.folio_id ?? ""),
    dpId: String(item.dp_id ?? ""),
    clientId: String(item.client_id ?? ""),
    pan: String(item.pan ?? ""),
    userName: String(item.user_name ?? ""),
    categoryCode: String(item.category_code ?? ""),
    categoryName: String(item.category_name ?? ""),
    totalPan1: toNumber(item.total_pan1),
    previousHolding: toNumber(item.previous_holding),
    presentHolding: toNumber(item.present_holding),
    buying: toNumber(item.buying),
    selling: toNumber(item.selling),
    presentHoldingPercentage: toNumber(item.present_holding_percentage),
  }))

  const pag = response.pagination ?? {}
  const totalRec = toNumber(response.total_records ?? pag.total_records ?? rows.length)
  const pageSize = toNumber(pag.page_size) || request.pageSize
  const page = toNumber(pag.page) || request.page
  const totalPages =
    toNumber(pag.total_pages) || (pageSize > 0 ? Math.ceil(totalRec / pageSize) : 1)

  return {
    currentDate: String(response.current_date ?? request.date),
    previousDate: String(response.previous_date ?? ""),
    shareCapital: toNumber(response.share_capital),
    totals: {
      totalRecords: totalRec,
      totalPreviousHolding: toNumber(response.total_previous_holding),
      totalBuying: toNumber(response.total_buying),
      totalSelling: toNumber(response.total_selling),
      totalPresentHolding: toNumber(response.total_present_holding),
      totalEquity: toNumber(response.total_equlty ?? response.total_equity),
    },
    rows,
    pagination: {
      page,
      pageSize,
      totalRecords: totalRec,
      totalPages,
      hasNext: Boolean(pag.has_next ?? page < totalPages),
      hasPrevious: Boolean(pag.has_previous ?? page > 1),
    },
  }
}

export function downloadOnePercentShareholdersExcel(
  request: OnePercentShareholdersRequest,
) {
  return download(
    endpoints.company.onePercentShareholdersExcel,
    `shareholders-holding-1-percent-and-above-${request.date}.xlsx`,
    {
      method: "POST",
      body: toOnePercentPayload(request),
    },
  )
}

export function downloadOnePercentShareholdersPdf(
  request: OnePercentShareholdersRequest,
) {
  return download(
    endpoints.company.onePercentShareholdersPdf,
    `shareholders-holding-1-percent-and-above-${request.date}.pdf`,
    {
      method: "POST",
      body: toOnePercentPayload(request),
    },
  )
}

