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

/**
 * This endpoint spells the date `uplod_date`. Other report endpoints use
 * `upload_date`, so do not align them.
 */
function toPayload({ companyId, date, categories }: ConsolidatedReportRequest) {
  return { company_id: companyId, uplod_date: toYmdDate(date), category: categories }
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

// ---------------------------------------------------------------------------
// Consolidated Change in Shareholding Pattern
// ---------------------------------------------------------------------------

export type DepositoryType = "NSDL" | "CDSL" | "ALL"

export interface ConsolidatedChangeRequest {
  companyId: number
  /** The later of the two dates being compared. */
  date1: string
  /** The earlier date, compared against. */
  date2: string
  categories: string[]
  depositoryType: DepositoryType
  /** Optional holding threshold; omitted from the payload when blank. */
  aboveValue?: string
}

/** One side of the comparison, as sent under as_on_from / as_on_to. */
export interface ChangePeriodFigures {
  cases: number
  holding: number
  percentage: number
}

export interface ConsolidatedChangeRow {
  /** Category code, named `status` on the wire. */
  code: string
  name: string
  from: ChangePeriodFigures
  to: ChangePeriodFigures
  differenceCases: number
  differenceHolding: number
}

export interface ConsolidatedChangeTotals {
  fromCases: number
  fromHolding: number
  fromPercentage: number
  toCases: number
  toHolding: number
  toPercentage: number
  differenceCases: number
  differenceHolding: number
}

export interface ConsolidatedChangeReport {
  /** The first date of the comparison, sent back as from_date. */
  fromDate: string
  toDate: string
  shareCapital: number
  rows: ConsolidatedChangeRow[]
  totals: ConsolidatedChangeTotals
}

interface ChangeFiguresRaw {
  cases?: unknown
  holding?: unknown
  percentage_to_equity?: unknown
}

interface ConsolidatedChangeRaw {
  from_date?: string
  to_date?: string
  share_capital?: unknown
  data?: Array<{
    status?: string
    cat_name?: string
    as_on_from?: ChangeFiguresRaw
    as_on_to?: ChangeFiguresRaw
    difference?: { cases?: unknown; holding?: unknown }
  }>
  totals?: {
    cases1?: unknown
    holding1?: unknown
    percentage1?: unknown
    cases2?: unknown
    holding2?: unknown
    percentage2?: unknown
    cases_diff?: unknown
    holding_diff?: unknown
  }
}

function toFigures(raw: ChangeFiguresRaw | undefined): ChangePeriodFigures {
  return {
    cases: toNumber(raw?.cases),
    holding: toNumber(raw?.holding),
    percentage: toNumber(raw?.percentage_to_equity),
  }
}

function toConsolidatedChangePayload(request: ConsolidatedChangeRequest) {
  const payload: Record<string, unknown> = {
    company_id: request.companyId,
    category: request.categories,
    upload_date_1: toYmdDate(request.date1),
    upload_date_2: toYmdDate(request.date2),
    depository_type: request.depositoryType,
  }

  // Sent only when set; the endpoint treats it as optional.
  const threshold = request.aboveValue?.trim()
  if (threshold) payload.above_value = threshold

  return payload
}

export async function fetchConsolidatedChange(
  request: ConsolidatedChangeRequest,
): Promise<ConsolidatedChangeReport> {
  const response = await http<ConsolidatedChangeRaw>(endpoints.company.consolidatedChange, {
    method: "POST",
    body: JSON.stringify(toConsolidatedChangePayload(request)),
  })

  const totals = response.totals ?? {}

  return {
    fromDate: String(response.from_date ?? request.date1),
    toDate: String(response.to_date ?? request.date2),
    shareCapital: toNumber(response.share_capital),
    rows: (response.data ?? []).map((row) => ({
      code: String(row.status ?? ""),
      name: String(row.cat_name ?? row.status ?? ""),
      from: toFigures(row.as_on_from),
      to: toFigures(row.as_on_to),
      differenceCases: toNumber(row.difference?.cases),
      differenceHolding: toNumber(row.difference?.holding),
    })),
    totals: {
      fromCases: toNumber(totals.cases1),
      fromHolding: toNumber(totals.holding1),
      fromPercentage: toNumber(totals.percentage1),
      toCases: toNumber(totals.cases2),
      toHolding: toNumber(totals.holding2),
      toPercentage: toNumber(totals.percentage2),
      differenceCases: toNumber(totals.cases_diff),
      differenceHolding: toNumber(totals.holding_diff),
    },
  }
}

/** The export endpoint returns CSV, so the fallback name matches. */
export function downloadConsolidatedChangeExcel(request: ConsolidatedChangeRequest) {
  return download(
    endpoints.company.consolidatedChangeExcel,
    `consolidated-change-in-shareholding-${request.date1}.csv`,
    { method: "POST", body: toConsolidatedChangePayload(request) },
  )
}

export function downloadConsolidatedChangePdf(request: ConsolidatedChangeRequest) {
  return download(
    endpoints.company.consolidatedChangePdf,
    `consolidated-change-in-shareholding-${request.date1}.pdf`,
    { method: "POST", body: toConsolidatedChangePayload(request) },
  )
}

// ---------------------------------------------------------------------------
// Distribution Schedule by Share Holding
// ---------------------------------------------------------------------------

/** One band of the schedule, inclusive at both ends. */
export interface HoldingRange {
  from: number
  to: number
}

export interface DistributionRequest {
  companyId: number
  date: string
  ranges: HoldingRange[]
}

export interface DistributionRow {
  range: string
  holders: number
  shares: number
  holderPercentage: number
  sharePercentage: number
}

export interface DistributionReport {
  currentDate: string
  totalHolders: number
  totalShares: number
  totalHolderPercentage: number
  totalSharePercentage: number
  rows: DistributionRow[]
}

interface DistributionRaw {
  current_date?: string
  total_holders?: unknown
  total_shares?: unknown
  total_holder_percentage?: unknown
  total_share_percentage?: unknown
  distribution?: Array<{
    share_holding_range?: string
    tot_holders?: unknown
    tot_shares?: unknown
    holder_percentage?: unknown
    share_percentage?: unknown
  }>
}

function toDistributionPayload(request: DistributionRequest) {
  return {
    // The endpoint takes a page, though it returns the whole schedule.
    page: 1,
    company_id: request.companyId,
    current_date: toYmdDate(request.date),
    ranges: request.ranges.map((range) => ({ from: range.from, to: range.to })),
  }
}

export async function fetchDistribution(
  request: DistributionRequest,
): Promise<DistributionReport> {
  const response = await http<DistributionRaw>(endpoints.company.distribution, {
    method: "POST",
    body: JSON.stringify(toDistributionPayload(request)),
  })

  return {
    currentDate: String(response.current_date ?? request.date),
    totalHolders: toNumber(response.total_holders),
    totalShares: toNumber(response.total_shares),
    totalHolderPercentage: toNumber(response.total_holder_percentage),
    totalSharePercentage: toNumber(response.total_share_percentage),
    rows: (response.distribution ?? []).map((row) => ({
      range: String(row.share_holding_range ?? ""),
      holders: toNumber(row.tot_holders),
      shares: toNumber(row.tot_shares),
      holderPercentage: toNumber(row.holder_percentage),
      sharePercentage: toNumber(row.share_percentage),
    })),
  }
}

/** The export endpoint returns CSV, so the fallback name matches. */
export function downloadDistributionExcel(request: DistributionRequest) {
  return download(
    endpoints.company.distributionExcel,
    `distribution-schedule-${request.date}.csv`,
    { method: "POST", body: toDistributionPayload(request) },
  )
}

export function downloadDistributionPdf(request: DistributionRequest) {
  return download(
    endpoints.company.distributionPdf,
    `distribution-schedule-${request.date}.pdf`,
    { method: "POST", body: toDistributionPayload(request) },
  )
}

// ---------------------------------------------------------------------------
// Distribution Schedule by Notional Value
// ---------------------------------------------------------------------------

export interface NotionalValueRow {
  range: string
  holders: number
  amount: number
  holderPercentage: number
  amountPercentage: number
}

export interface NotionalValueReport {
  currentDate: string
  faceValue: number
  totalHolders: number
  totalAmount: number
  totalHolderPercentage: number
  totalAmountPercentage: number
  rows: NotionalValueRow[]
}

interface NotionalValueRaw {
  current_date?: string
  face_value?: unknown
  total_holders?: unknown
  total_amount?: unknown
  total_holder_percentage?: unknown
  amount_percentage?: unknown
  distribution?: Array<{
    notional_value_range?: string
    tot_holders?: unknown
    amount?: unknown
    holder_percentage?: unknown
    amount_percentage?: unknown
  }>
}

/** Same request shape as the share holding schedule. */
export async function fetchNotionalValue(
  request: DistributionRequest,
): Promise<NotionalValueReport> {
  const response = await http<NotionalValueRaw>(endpoints.company.notionalValue, {
    method: "POST",
    body: JSON.stringify(toDistributionPayload(request)),
  })

  return {
    currentDate: String(response.current_date ?? request.date),
    faceValue: toNumber(response.face_value),
    totalHolders: toNumber(response.total_holders),
    totalAmount: toNumber(response.total_amount),
    totalHolderPercentage: toNumber(response.total_holder_percentage),
    totalAmountPercentage: toNumber(response.amount_percentage),
    rows: (response.distribution ?? []).map((row) => ({
      range: String(row.notional_value_range ?? ""),
      holders: toNumber(row.tot_holders),
      amount: toNumber(row.amount),
      holderPercentage: toNumber(row.holder_percentage),
      amountPercentage: toNumber(row.amount_percentage),
    })),
  }
}

/** The export endpoint returns CSV, so the fallback name matches. */
export function downloadNotionalValueExcel(request: DistributionRequest) {
  return download(
    endpoints.company.notionalValueExcel,
    `notional-value-distribution-${request.date}.csv`,
    { method: "POST", body: toDistributionPayload(request) },
  )
}

export function downloadNotionalValuePdf(request: DistributionRequest) {
  return download(
    endpoints.company.notionalValuePdf,
    `notional-value-distribution-${request.date}.pdf`,
    { method: "POST", body: toDistributionPayload(request) },
  )
}

// ---------------------------------------------------------------------------
// Top 100 Shareholder comparison for 2 weeks
// ---------------------------------------------------------------------------

/** Selectable alongside the category codes, as its own grouping. */
export const PROMOTER_GROUP_CATEGORY = "promoter_group"

export interface TopHundredRequest {
  companyId: number
  /** The first date of the comparison. */
  date1: string
  date2: string
  categories: string[]
}

export interface TopHundredRow {
  dpId: string
  clientId: string
  name: string
  pan: string
  categoryCode: string
  categoryName: string
  holding1: number
  equity1: number
  buying: number
  selling: number
  holding2: number
  equity2: number
}

export interface TopHundredTotals {
  holding1: number
  equity1: number
  buying: number
  selling: number
  holding2: number
  equity2: number
}

export interface TopHundredReport {
  shareCapital: number
  count: number
  rows: TopHundredRow[]
  totals: TopHundredTotals
}

interface TopHundredRaw {
  share_capital?: unknown
  count?: unknown
  data?: Array<{
    dp_id?: string | null
    client_id?: string | null
    name?: string | null
    pan?: string | null
    cat_name?: string | null
    category?: string | null
    shareholding_1?: unknown
    to_equity_1?: unknown
    buying?: unknown
    selling?: unknown
    shareholding_2?: unknown
    to_equity_2?: unknown
  }>
  totals?: {
    shareholding_1?: unknown
    to_equity_1?: unknown
    buying?: unknown
    selling?: unknown
    shareholding_2?: unknown
    to_equity_2?: unknown
  }
}

function toTopHundredPayload(request: TopHundredRequest) {
  return {
    page: 1,
    company_id: request.companyId,
    category: request.categories,
    date_1: toYmdDate(request.date2),
    date_2: toYmdDate(request.date1),
  }
}

export async function fetchTopHundredComparison(
  request: TopHundredRequest,
): Promise<TopHundredReport> {
  const response = await http<TopHundredRaw>(endpoints.company.topHundredComparison, {
    method: "POST",
    body: JSON.stringify(toTopHundredPayload(request)),
  })

  const totals = response.totals ?? {}

  return {
    shareCapital: toNumber(response.share_capital),
    count: toNumber(response.count),
    rows: (response.data ?? []).map((row) => ({
      // dp_id comes back null for physical holdings.
      dpId: row.dp_id ?? "",
      clientId: row.client_id ?? "",
      name: row.name ?? "",
      pan: row.pan ?? "",
      categoryCode: row.category ?? "",
      categoryName: row.cat_name ?? "",
      holding1: toNumber(row.shareholding_1),
      equity1: toNumber(row.to_equity_1),
      buying: toNumber(row.buying),
      selling: toNumber(row.selling),
      holding2: toNumber(row.shareholding_2),
      equity2: toNumber(row.to_equity_2),
    })),
    totals: {
      holding1: toNumber(totals.shareholding_1),
      equity1: toNumber(totals.to_equity_1),
      buying: toNumber(totals.buying),
      selling: toNumber(totals.selling),
      holding2: toNumber(totals.shareholding_2),
      equity2: toNumber(totals.to_equity_2),
    },
  }
}

/** The export endpoint returns CSV, so the fallback name matches. */
export function downloadTopHundredExcel(request: TopHundredRequest) {
  return download(
    endpoints.company.topHundredComparisonExcel,
    `top-100-shareholder-comparison-${request.date1}.csv`,
    { method: "POST", body: toTopHundredPayload(request) },
  )
}

export function downloadTopHundredPdf(request: TopHundredRequest) {
  return download(
    endpoints.company.topHundredComparisonPdf,
    `top-100-shareholder-comparison-${request.date1}.pdf`,
    { method: "POST", body: toTopHundredPayload(request) },
  )
}

// ---------------------------------------------------------------------------
// Lock-in Shares Summary
// ---------------------------------------------------------------------------

export interface LockInRequest {
  companyId: number
  date: string
  categories: string[]
}

export interface LockInRow {
  /** Category code, named `status` on the wire. */
  code: string
  name: string
  holders: number
  totalShares: number
  lockInShares: number
  holdingPercentage: number
}

export interface LockInTotals {
  holders: number
  totalShares: number
  lockInShares: number
  holdingPercentage: number
}

export interface LockInReport {
  uploadDate: string
  shareCapital: number
  rows: LockInRow[]
  totals: LockInTotals
}

interface LockInRaw {
  upload_date?: string
  share_capital?: unknown
  summary?: Array<{
    status?: string
    category_name?: string
    holders?: unknown
    total_shares?: unknown
    lockin_shares?: unknown
    holding_percentage?: unknown
  }>
  totals?: {
    holders?: unknown
    total_shares?: unknown
    lockin_shares?: unknown
    holding_percentage?: unknown
  }
}

/** This endpoint spells the list `categories`, unlike the others. */
function toLockInPayload(request: LockInRequest) {
  return {
    company_id: request.companyId,
    upload_date: toYmdDate(request.date),
    categories: request.categories,
  }
}

export async function fetchLockInShares(request: LockInRequest): Promise<LockInReport> {
  const response = await http<LockInRaw>(endpoints.company.lockInShares, {
    method: "POST",
    body: JSON.stringify(toLockInPayload(request)),
  })

  const totals = response.totals ?? {}

  return {
    uploadDate: String(response.upload_date ?? request.date),
    shareCapital: toNumber(response.share_capital),
    rows: (response.summary ?? []).map((row) => ({
      code: String(row.status ?? ""),
      name: String(row.category_name ?? row.status ?? ""),
      holders: toNumber(row.holders),
      totalShares: toNumber(row.total_shares),
      lockInShares: toNumber(row.lockin_shares),
      holdingPercentage: toNumber(row.holding_percentage),
    })),
    totals: {
      holders: toNumber(totals.holders),
      totalShares: toNumber(totals.total_shares),
      lockInShares: toNumber(totals.lockin_shares),
      holdingPercentage: toNumber(totals.holding_percentage),
    },
  }
}

/** The export endpoint returns CSV, so the fallback name matches. */
export function downloadLockInSharesExcel(request: LockInRequest) {
  return download(endpoints.company.lockInSharesExcel, `lock-in-shares-${request.date}.csv`, {
    method: "POST",
    body: toLockInPayload(request),
  })
}

export function downloadLockInSharesPdf(request: LockInRequest) {
  return download(endpoints.company.lockInSharesPdf, `lock-in-shares-${request.date}.pdf`, {
    method: "POST",
    body: toLockInPayload(request),
  })
}

// ---------------------------------------------------------------------------
// Share Holding
// ---------------------------------------------------------------------------

/**
 * Columns the endpoint will return, confirmed by probing it: anything else
 * in `keys` is silently dropped from the rows.
 */
export const SHARE_HOLDING_KEYS = [
  { value: "folio_id", label: "Folio ID" },
  { value: "holder_name", label: "Holder name" },
  { value: "pan1", label: "PAN 1" },
  { value: "pan2", label: "PAN 2" },
  { value: "shares", label: "Shares", numeric: true },
  { value: "percentage", label: "% To Equity", percentage: true },
  { value: "folio_count", label: "Folio count", numeric: true },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "address1", label: "Address 1" },
  { value: "address2", label: "Address 2" },
  { value: "address3", label: "Address 3" },
  { value: "address4", label: "Address 4" },
  { value: "pin", label: "PIN" },
] as const

export type ShareHoldingKey = (typeof SHARE_HOLDING_KEYS)[number]["value"]

/** The columns the sample payload asks for. */
export const DEFAULT_SHARE_HOLDING_KEYS: string[] = [
  "folio_id",
  "holder_name",
  "pan1",
  "shares",
  "percentage",
  "folio_count",
]

/** Single-letter codes: All, NSDL, CDSL, Physical. */
export type ShareHoldingDepository = "A" | "N" | "C" | "P"

export interface ShareHoldingRequest {
  companyId: number
  depositoryType: ShareHoldingDepository
  /** One or more record dates, sent as `record_dates`. */
  dates: string[]
  categories: string[]
  /** Top N holdings to consider. */
  range: number
  page: number
  pageSize: number
  keys: string[]
}

export interface ShareHoldingReport {
  rows: ReportRow[]
  shareCapital: number
  range: number
  totalTopShares: number
  totalPercentage: number
  pagination: PaginationMeta
}

interface ShareHoldingRaw {
  data?: ReportRow[]
  company_share_capital?: unknown
  range?: unknown
  totals?: { total_top_shares?: unknown; total_percentage?: unknown }
  pagination?: {
    page?: unknown
    page_size?: unknown
    total_records?: unknown
    total_pages?: unknown
    has_next?: boolean
    has_previous?: boolean
  }
}

function toShareHoldingPayload(request: ShareHoldingRequest, isExport = false) {
  const payload: Record<string, unknown> = {
    company_id: request.companyId,
    record_dates: request.dates.map(toYmdDate),
    categories: request.categories,
    range: request.range,
    page_size: request.pageSize,
    type: request.depositoryType,
    keys: request.keys,
  }

  // Exports return the whole set, so they carry no page.
  if (!isExport) payload.page = request.page
  return payload
}

export async function fetchShareHolding(
  request: ShareHoldingRequest,
): Promise<ShareHoldingReport> {
  const response = await http<ShareHoldingRaw>(endpoints.company.shareHolding, {
    method: "POST",
    body: JSON.stringify(toShareHoldingPayload(request)),
  })

  const pagination = response.pagination ?? {}
  const page = toNumber(pagination.page) || request.page
  const pageSize = toNumber(pagination.page_size) || request.pageSize
  const totalRecords = toNumber(pagination.total_records)
  const totalPages =
    toNumber(pagination.total_pages) || (pageSize > 0 ? Math.ceil(totalRecords / pageSize) : 1)

  return {
    rows: response.data ?? [],
    shareCapital: toNumber(response.company_share_capital),
    range: toNumber(response.range) || request.range,
    totalTopShares: toNumber(response.totals?.total_top_shares),
    totalPercentage: toNumber(response.totals?.total_percentage),
    pagination: {
      page,
      pageSize,
      totalRecords,
      totalPages,
      hasNext: Boolean(pagination.has_next),
      hasPrevious: Boolean(pagination.has_previous),
    },
  }
}

/** The export endpoint returns CSV, so the fallback name matches. */
export function downloadShareHoldingExcel(request: ShareHoldingRequest) {
  return download(endpoints.company.shareHoldingExcel, `share-holding-${request.dates[0]}.csv`, {
    method: "POST",
    body: toShareHoldingPayload(request, true),
  })
}

export function downloadShareHoldingPdf(request: ShareHoldingRequest) {
  return download(endpoints.company.shareHoldingPdf, `share-holding-${request.dates[0]}.pdf`, {
    method: "POST",
    body: toShareHoldingPayload(request, true),
  })
}

// ---------------------------------------------------------------------------
// Pledge Shares Summary
// ---------------------------------------------------------------------------

export interface PledgeRow {
  code: string
  name: string
  holders: number
  totalShares: number
  pledgeShares: number
  pledgePercentage: number
}

export interface PledgeTotals {
  holders: number
  totalShares: number
  pledgeShares: number
  pledgePercentage: number
}

export interface PledgeReport {
  uploadDate: string
  rows: PledgeRow[]
  totals: PledgeTotals
}

interface PledgeRaw {
  data?: Array<{
    category_code?: string
    category_name?: string
    holders?: unknown
    total_shares?: unknown
    pledge_shares?: unknown
    pledge_percentage?: unknown
  }>
  /** Singular here, unlike the lock-in report's `totals`. */
  total?: {
    holders?: unknown
    total_shares?: unknown
    pledge_shares?: unknown
    pledge_percentage?: unknown
  }
}

/** Same request shape as the lock-in summary. */
export async function fetchPledgeShares(request: LockInRequest): Promise<PledgeReport> {
  const response = await http<PledgeRaw>(endpoints.company.pledgeShares, {
    method: "POST",
    body: JSON.stringify(toLockInPayload(request)),
  })

  const totals = response.total ?? {}

  return {
    uploadDate: request.date,
    rows: (response.data ?? []).map((row) => ({
      code: String(row.category_code ?? ""),
      name: String(row.category_name ?? row.category_code ?? ""),
      holders: toNumber(row.holders),
      totalShares: toNumber(row.total_shares),
      pledgeShares: toNumber(row.pledge_shares),
      pledgePercentage: toNumber(row.pledge_percentage),
    })),
    totals: {
      holders: toNumber(totals.holders),
      totalShares: toNumber(totals.total_shares),
      pledgeShares: toNumber(totals.pledge_shares),
      pledgePercentage: toNumber(totals.pledge_percentage),
    },
  }
}

/** The export endpoint returns CSV, so the fallback name matches. */
export function downloadPledgeSharesExcel(request: LockInRequest) {
  return download(endpoints.company.pledgeSharesExcel, `pledge-shares-${request.date}.csv`, {
    method: "POST",
    body: toLockInPayload(request),
  })
}

export function downloadPledgeSharesPdf(request: LockInRequest) {
  return download(endpoints.company.pledgeSharesPdf, `pledge-shares-${request.date}.pdf`, {
    method: "POST",
    body: toLockInPayload(request),
  })
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchRequest {
  companyId: number
  keyword: string
  /** Empty when searching across every date. */
  date: string
  page: number
  pageSize: number
}

export interface SearchRow {
  insertDate: string
  dpId: string
  folioId: string
  clientId: string
  name: string
  shares: number
  sharePercentage: number
  jointHolder1: string
  jointHolder2: string
  address: string
  pin: string
  email: string
  phone: string
  fatherOrHusband: string
  occupation: string
  pan1: string
  pan2: string
  pan3: string
}

export interface SearchReport {
  rows: SearchRow[]
  countInPage: number
  sharesInPage: number
  pagination: PaginationMeta
}

interface SearchRaw {
  data?: Array<Record<string, unknown>>
  summary?: { count_in_page?: unknown; total_shares_in_page?: unknown }
  pagination?: {
    page?: unknown
    page_size?: unknown
    total_items?: unknown
    total_pages?: unknown
    has_next?: boolean
    has_previous?: boolean
  }
}

function text(value: unknown) {
  return value === null || value === undefined ? "" : String(value)
}

/**
 * `upload_date` is an empty array when no date is chosen and a plain
 * string when one is, which is what `include_date` signals.
 */
function toSearchPayload(request: SearchRequest, withPage: boolean) {
  const hasDate = Boolean(request.date)
  const payload: Record<string, unknown> = {
    company_id: request.companyId,
    upload_date: hasDate ? toYmdDate(request.date) : [],
    include_date: hasDate,
    keyword: request.keyword.trim(),
  }

  if (withPage) {
    payload.page = request.page
    payload.page_size = request.pageSize
  }

  return payload
}

export async function fetchSearch(request: SearchRequest): Promise<SearchReport> {
  const response = await http<SearchRaw>(endpoints.company.search, {
    method: "POST",
    body: JSON.stringify(toSearchPayload(request, true)),
  })

  const pagination = response.pagination ?? {}
  const page = toNumber(pagination.page) || request.page
  const pageSize = toNumber(pagination.page_size) || request.pageSize
  const totalRecords = toNumber(pagination.total_items)
  const totalPages =
    toNumber(pagination.total_pages) || (pageSize > 0 ? Math.ceil(totalRecords / pageSize) : 1)

  return {
    rows: (response.data ?? []).map((row) => ({
      insertDate: text(row.insert_date),
      dpId: text(row.Dp_ID),
      folioId: text(row.Folio_ID),
      clientId: text(row.client_id),
      name: text(row.user_name),
      shares: toNumber(row.Shares),
      sharePercentage: toNumber(row.share_percentage),
      jointHolder1: text(row.Jh1),
      jointHolder2: text(row.Jh2),
      // The four address lines read as one block.
      address: [row.address1, row.address2, row.address3, row.address4]
        .map(text)
        .filter(Boolean)
        .join(", "),
      pin: text(row.pin),
      email: text(row.email_id),
      phone: text(row.phone),
      fatherOrHusband: text(row.father_husband),
      occupation: text(row.occupation),
      pan1: text(row.Pan1),
      pan2: text(row.Pan2),
      pan3: text(row.Pan3),
    })),
    countInPage: toNumber(response.summary?.count_in_page),
    sharesInPage: toNumber(response.summary?.total_shares_in_page),
    pagination: {
      page,
      pageSize,
      totalRecords,
      totalPages,
      hasNext: Boolean(pagination.has_next),
      hasPrevious: Boolean(pagination.has_previous),
    },
  }
}

/** The export endpoint returns CSV, so the fallback name matches. */
export function downloadSearchExcel(request: SearchRequest) {
  return download(endpoints.company.searchExcel, `search-${request.keyword.trim()}.csv`, {
    method: "POST",
    body: toSearchPayload(request, false),
  })
}

export function downloadSearchPdf(request: SearchRequest) {
  return download(endpoints.company.searchPdf, `search-${request.keyword.trim()}.pdf`, {
    method: "POST",
    body: toSearchPayload(request, false),
  })
}

// ---------------------------------------------------------------------------
// Benpose Details
// ---------------------------------------------------------------------------

/** This endpoint spells the combined option "All", not "ALL". */
export type BenposeDepository = "All" | "NSDL" | "CDSL" | "PHYSICAL"

export interface BenposeRequest {
  companyId: number
  depositoryType: BenposeDepository
  date: string
  page: number
  pageSize: number
}

export interface BenposeRow {
  id: number
  companyCode: string
  insertDate: string
  folioId: string
  dpId: string
  name: string
  shares: number
  pledgeShares: number
  lockShares: number
  address: string
  pin: string
  pan1: string
  status: string
  depositoryType: string
}

export interface BenposeReport {
  rows: BenposeRow[]
  pagination: PaginationMeta
}

interface BenposeRaw {
  total_records?: unknown
  page?: unknown
  page_size?: unknown
  data?: Array<Record<string, unknown>>
}

function toBenposePayload(request: BenposeRequest, withPage: boolean) {
  const payload: Record<string, unknown> = {
    company_id: request.companyId,
    depository_type: request.depositoryType,
    insert_date: toYmdDate(request.date),
  }

  // Exports return the whole set, so they carry no page.
  if (withPage) {
    payload.page = request.page
    payload.page_size = request.pageSize
  }

  return payload
}

export async function fetchBenpose(request: BenposeRequest): Promise<BenposeReport> {
  const response = await http<BenposeRaw>(endpoints.company.benpose, {
    method: "POST",
    body: JSON.stringify(toBenposePayload(request, true)),
  })

  // Paging fields sit at the top level here, not in a pagination block.
  const page = toNumber(response.page) || request.page
  const pageSize = toNumber(response.page_size) || request.pageSize
  const totalRecords = toNumber(response.total_records)

  return {
    rows: (response.data ?? []).map((row) => ({
      id: toNumber(row.id),
      companyCode: text(row.company_code),
      insertDate: text(row.insert_date),
      folioId: text(row.Folio_ID),
      dpId: text(row.Dp_ID),
      name: text(row.user_name),
      shares: toNumber(row.Shares),
      pledgeShares: toNumber(row.Pledge_Shares),
      lockShares: toNumber(row.Lock_Shares),
      address: [row.address1, row.address2, row.address3]
        .map(text)
        .filter(Boolean)
        .join(", "),
      pin: text(row.pin),
      pan1: text(row.Pan1),
      status: text(row.status),
      depositoryType: text(row.depository_type),
    })),
    pagination: {
      page,
      pageSize,
      totalRecords,
      totalPages: pageSize > 0 ? Math.max(1, Math.ceil(totalRecords / pageSize)) : 1,
      hasNext: page * pageSize < totalRecords,
      hasPrevious: page > 1,
    },
  }
}

/** The export endpoint returns CSV, so the fallback name matches. */
export function downloadBenposeExcel(request: BenposeRequest) {
  return download(endpoints.company.benposeExcel, `benpose-details-${request.date}.csv`, {
    method: "POST",
    body: toBenposePayload(request, false),
  })
}

export function downloadBenposePdf(request: BenposeRequest) {
  return download(endpoints.company.benposePdf, `benpose-details-${request.date}.pdf`, {
    method: "POST",
    body: toBenposePayload(request, false),
  })
}

// ---------------------------------------------------------------------------
// Folio details, opened from a "Multiple Folio ID" row
// ---------------------------------------------------------------------------

/** The cell text that marks a holder with more than one folio. */
export const MULTIPLE_FOLIO_LABEL = "Multiple Folio ID"

export interface FolioDetailsRequest {
  companyId: number
  pan: string
  date: string
}

export interface FolioDetailRow {
  clientId: string
  name: string
  shares: number
  jointHolder1: string
  jointHolder2: string
  address: string
  pin: string
  email: string
  phone: string
  fatherOrHusband: string
  occupation: string
  pan: string
}

export interface FolioDetailsResult {
  pan: string
  rowCount: number
  rows: FolioDetailRow[]
}

interface FolioDetailsRaw {
  pan?: string
  row_count?: unknown
  data?: Array<Record<string, unknown>>
}

export async function fetchFolioDetails(
  request: FolioDetailsRequest,
): Promise<FolioDetailsResult> {
  const response = await http<FolioDetailsRaw>(endpoints.company.folioDetails, {
    method: "POST",
    body: JSON.stringify({
      company_id: request.companyId,
      pan: request.pan,
      upload_date: toYmdDate(request.date),
    }),
  })

  return {
    pan: text(response.pan) || request.pan,
    rowCount: toNumber(response.row_count),
    rows: (response.data ?? []).map((row) => ({
      clientId: text(row.client_id),
      name: text(row.user_name),
      shares: toNumber(row.shares),
      jointHolder1: text(row.joint_holder1),
      jointHolder2: text(row.joint_holder2),
      address: [row.address1, row.address2, row.address3, row.address4]
        .map(text)
        .filter(Boolean)
        .join(", "),
      pin: text(row.pin),
      email: text(row.email),
      phone: text(row.phone),
      fatherOrHusband: text(row.father_husband),
      occupation: text(row.occupation),
      pan: text(row.pan),
    })),
  }
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

