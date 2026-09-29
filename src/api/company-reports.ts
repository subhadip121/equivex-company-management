import { endpoints } from "@/api/endpoints"
import { download, http } from "@/api/http"

/** A filter choice, normalised from whatever the lookup endpoint returns. */
export interface FilterOption {
  value: string
  label: string
}

export interface ConsolidatedReportRequest {
  companyId: number
  /** Spelled `uplod_date` on the wire, matching the API. */
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
      return { value, label: String(rawLabel ?? rawValue), }
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

export async function fetchReportDates(): Promise<FilterOption[]> {
  const response = await http<unknown>(endpoints.company.reportDates)
  const options = toOptions(
    response,
    ["uplod_date", "upload_date", "inserted_date", "insert_date", "date", "value"],
    ["uplod_date", "upload_date", "inserted_date", "insert_date", "date", "label"],
  )

  // The value stays exactly as the API sent it, since it goes back in the
  // report payload; only the label is reformatted.
  return options.map((option) => ({ ...option, label: toDisplayDate(option.label) }))
}

function toPayload({ companyId, date, categories }: ConsolidatedReportRequest) {
  return { company_id: companyId, uplod_date: date, category: categories }
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
