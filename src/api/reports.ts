import { endpoints } from "@/api/endpoints"
import { upload } from "@/api/http"
import { ApiError } from "@/lib/api-error"

export type ReportType = "year_ending" | "AGM"

/**
 * "new" is the first attempt. If the server reports a conflict, the user
 * chooses: "reupload" replaces what is already stored, "continue" carries
 * on from where the previous run stopped.
 */
export type UploadAction = "new" | "reupload" | "continue"

export type UploadOutcome = "success" | "partial_success" | "conflict"

export interface ShareReportResult {
  outcome: UploadOutcome
  message?: string
  processed?: number
  failed?: number
  errors: string[]
}

interface ShareReportResponse {
  /** The flags may arrive as booleans of their own name. */
  partial_success?: boolean
  conflict?: boolean
  flag?: string
  status_flag?: string
  type?: string
  error_type?: string
  action?: string
  status?: boolean | string
  message?: string
  detail?: string
  processed?: number
  success_count?: number
  inserted?: number
  total_records?: number
  failed?: number
  failed_count?: number
  error_count?: number
  errors?: unknown
  data?: {
    errors?: unknown
    processed?: number
    failed?: number
    message?: string
    partial_success?: boolean
    conflict?: boolean
  }
}

function describe(value: unknown): string {
  if (typeof value === "string") return value
  if (Array.isArray(value)) return value.map(describe).join(", ")
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>
    const label = row.row ?? row.line ?? row.index ?? row.folio
    const reason = row.message ?? row.error ?? row.detail ?? row.errors
    if (reason !== undefined) {
      return label === undefined ? describe(reason) : `Row ${label}: ${describe(reason)}`
    }
    return Object.entries(row)
      .map(([key, entry]) => `${key}: ${describe(entry)}`)
      .join(" · ")
  }
  return String(value)
}

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

function firstNumber(...values: Array<number | undefined>) {
  return values.find((value) => typeof value === "number" && Number.isFinite(value))
}

/**
 * Phrases the backend uses when it is asking a question rather than
 * reporting a failure. Used only when no explicit flag came back.
 */
const CONFLICT_PHRASES = [
  "already exists",
  "already exist",
  "already uploaded",
  "do you want to replace",
  "want to replace",
  "already present",
]

function readOutcome(body: ShareReportResponse): UploadOutcome {
  // Most direct form: a boolean named after the outcome, at the top level
  // or inside `data`.
  const nested = (body.data ?? {}) as { partial_success?: boolean; conflict?: boolean }
  if (body.conflict === true || nested.conflict === true) return "conflict"
  if (body.partial_success === true || nested.partial_success === true) return "partial_success"

  // The flag may also be spelled several ways, or ride on `status` as a string.
  const flag = [
    body.flag,
    body.status_flag,
    body.type,
    body.error_type,
    body.action,
    typeof body.status === "string" ? body.status : undefined,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  if (flag.includes("conflict")) return "conflict"
  if (flag.includes("partial")) return "partial_success"

  // No flag: fall back to the wording, so a question is never shown as a
  // dead end with no way forward.
  const text = `${body.message ?? ""} ${body.detail ?? ""}`.toLowerCase()
  if (CONFLICT_PHRASES.some((phrase) => text.includes(phrase))) return "conflict"
  if (text.includes("partial")) return "partial_success"

  return "success"
}

function toResult(body: ShareReportResponse): ShareReportResult {
  const nested = body.data ?? {}
  return {
    outcome: readOutcome(body),
    message: body.message ?? body.detail ?? nested.message,
    processed: firstNumber(
      body.processed,
      body.success_count,
      body.inserted,
      body.total_records,
      nested.processed,
    ),
    failed: firstNumber(body.failed, body.failed_count, body.error_count, nested.failed),
    errors: toErrorList(body.errors ?? nested.errors),
  }
}

/**
 * Uploads the NSDL/CDSL physical share consolidated report.
 *
 * A conflict is a decision for the user, not a failure, so it comes back as
 * a result even when the server signals it with an error status.
 */
export async function uploadShareReport({
  file,
  reportType,
  uploadAction,
  onProgress,
}: {
  file: File
  reportType: ReportType
  uploadAction: UploadAction
  onProgress?: (percent: number) => void
}): Promise<ShareReportResult> {
  const form = new FormData()
  form.append("file", file)
  form.append("report_type", reportType)
  form.append("upload_action", uploadAction)

  try {
    const response = await upload<ShareReportResponse>(endpoints.admin.shareReportUpload, form, {
      onProgress,
    })
    return toResult(response ?? {})
  } catch (error) {
    if (error instanceof ApiError && error.details) {
      const body = error.details as ShareReportResponse
      const outcome = readOutcome(body)
      if (outcome !== "success") {
        return { ...toResult(body), message: body.message ?? error.message }
      }
    }
    throw error
  }
}
