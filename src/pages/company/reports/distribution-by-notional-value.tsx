import { useState } from "react"
import { AlertCircle, TableIcon } from "lucide-react"
import { toast } from "sonner"
import {
  NotionalValueSummary,
  NotionalValueTable,
} from "@/components/report/notional-value-table"
import { RangeReportFilters } from "@/components/report/range-report-filters"
import { ReportTableSkeleton } from "@/components/report/report-data-table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import {
  useDownloadNotionalValue,
  useNotionalValue,
  useReportDates,
} from "@/hooks/use-company-reports"
import {
  DEFAULT_RANGES,
  toHoldingRanges,
  validateRanges,
  type RangeDraft,
} from "@/lib/holding-ranges"
import { QueryError } from "@/pages/shared/query-error"
import type { DistributionRequest } from "@/api/company-reports"

export function DistributionByNotionalValueReport() {
  const { user } = useAuth()
  const companyId = Number(user?.id)

  const dates = useReportDates()

  const [chosenDate, setChosenDate] = useState<string | null>(null)
  const [ranges, setRanges] = useState<RangeDraft[]>(DEFAULT_RANGES)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState<DistributionRequest | null>(null)

  const date = chosenDate ?? dates.data?.[0]?.value ?? ""

  const report = useNotionalValue(applied)
  const { excel, pdf } = useDownloadNotionalValue()

  const canApply = Boolean(date) && Number.isFinite(companyId)

  /** Shared by the results and the downloads, which use the same filters. */
  function buildRequest(): DistributionRequest | null {
    setError(null)
    if (!canApply) return null

    const problem = validateRanges(ranges)
    if (problem) {
      setError(problem)
      return null
    }

    return { companyId, date, ranges: toHoldingRanges(ranges) }
  }

  function apply() {
    const request = buildRequest()
    if (request) setApplied(request)
  }

  function runDownload(kind: "excel" | "pdf") {
    const request = buildRequest()
    if (!request) return

    const mutation = kind === "excel" ? excel : pdf
    mutation.mutate(request, { onError: (downloadError) => toast.error(downloadError.message) })
  }

  return (
    <>
      <RangeReportFilters
        dates={dates.data}
        datesLoading={dates.isPending}
        date={date}
        onDateChange={setChosenDate}
        ranges={ranges}
        onRangesChange={setRanges}
        onSubmit={apply}
        onDownload={runDownload}
        canSubmit={canApply}
        isFetching={report.isFetching}
        isExcelPending={excel.isPending}
        isPdfPending={pdf.isPending}
      />

      {error ? (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {dates.isError ? (
        <div className="mb-3">
          <QueryError
            message="The dates could not be loaded."
            onRetry={() => void dates.refetch()}
          />
        </div>
      ) : null}

      {report.data && report.data.rows.length > 0 ? (
        <NotionalValueSummary report={report.data} />
      ) : null}

      <Card className="overflow-hidden py-0">
        {!applied ? (
          <EmptyState
            title="Choose your filters"
            body="Pick a date and the notional value ranges, then get the results."
          />
        ) : report.isPending ? (
          <ReportTableSkeleton columns={5} />
        ) : report.isError ? (
          <div className="p-4">
            <QueryError onRetry={() => void report.refetch()} />
          </div>
        ) : report.data && report.data.rows.length > 0 ? (
          <NotionalValueTable report={report.data} />
        ) : (
          <EmptyState title="No results" body="No holders fell into these ranges." />
        )}
      </Card>
    </>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="rounded-full bg-muted p-3">
        <TableIcon className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  )
}
