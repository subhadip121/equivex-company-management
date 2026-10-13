import { useState } from "react"
import { AlertCircle, FileDown, FileSpreadsheet, Filter, Loader2, TableIcon } from "lucide-react"
import { toast } from "sonner"
import { PaginationBar } from "@/components/layout/pagination-bar"
import { BenposeTable } from "@/components/report/benpose-table"
import { ReportTableSkeleton } from "@/components/report/report-data-table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { useBenpose, useDownloadBenpose, useReportDates } from "@/hooks/use-company-reports"
import { QueryError } from "@/pages/shared/query-error"
import type { BenposeDepository, BenposeRequest } from "@/api/company-reports"

const DEPOSITORY_TYPES: BenposeDepository[] = ["All", "NSDL", "CDSL", "PHYSICAL"]
const PAGE_SIZE = 200

export function BenposeDetailsReport() {
  const { user } = useAuth()
  const companyId = Number(user?.id)

  const dates = useReportDates()

  const [chosenDate, setChosenDate] = useState<string | null>(null)
  const [depositoryType, setDepositoryType] = useState<BenposeDepository>("All")
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState<BenposeRequest | null>(null)

  const date = chosenDate ?? dates.data?.[0]?.value ?? ""

  const report = useBenpose(applied)
  const { excel, pdf } = useDownloadBenpose()
  const isDownloading = excel.isPending || pdf.isPending

  const hasCompany = Number.isFinite(companyId) && companyId > 0
  const canApply = Boolean(date) && hasCompany

  function buildRequest(page: number): BenposeRequest | null {
    setError(null)

    if (!hasCompany) {
      setError("Your company could not be identified. Sign out and in again.")
      return null
    }
    if (!date) {
      setError("Choose a record date.")
      return null
    }

    return { companyId, depositoryType, date, page, pageSize: PAGE_SIZE }
  }

  function apply() {
    const request = buildRequest(1)
    if (request) setApplied(request)
  }

  function runDownload(kind: "excel" | "pdf") {
    const request = buildRequest(1)
    if (!request) return

    const mutation = kind === "excel" ? excel : pdf
    mutation.mutate(request, { onError: (downloadError) => toast.error(downloadError.message) })
  }

  const firstRowNumber = report.data
    ? (report.data.pagination.page - 1) * report.data.pagination.pageSize + 1
    : 1

  return (
    <>
      <Card className="mb-3 py-0">
        <CardContent className="flex flex-wrap items-end gap-3 p-3">
          <div className="w-56 space-y-1.5">
            <Label htmlFor="report-date" className="text-xs">
              Record date
            </Label>
            {dates.isPending ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={date} onValueChange={setChosenDate} disabled={!dates.data?.length}>
                <SelectTrigger id="report-date" className="w-full">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {dates.data?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="w-40 space-y-1.5">
            <Label htmlFor="depository-type" className="text-xs">
              Depository
            </Label>
            <Select
              value={depositoryType}
              onValueChange={(value) => setDepositoryType(value as BenposeDepository)}
            >
              <SelectTrigger id="depository-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPOSITORY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" disabled={!canApply || report.isFetching} onClick={apply}>
              {report.isFetching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Filter className="size-4" />
              )}
              {report.isFetching ? "Loading…" : "Get results"}
            </Button>

            <Button
              variant="outline"
              size="icon"
              aria-label="Download Excel"
              title="Download Excel"
              disabled={!canApply || isDownloading}
              onClick={() => runDownload("excel")}
            >
              {excel.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="size-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              aria-label="Download PDF"
              title="Download PDF"
              disabled={!canApply || isDownloading}
              onClick={() => runDownload("pdf")}
            >
              {pdf.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileDown className="size-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

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

      <Card className="overflow-hidden py-0">
        {!applied ? (
          <EmptyState
            title="Choose your filters"
            body="Pick a record date and a depository, then get the results."
          />
        ) : report.isPending ? (
          <ReportTableSkeleton columns={9} />
        ) : report.isError ? (
          <div className="p-4">
            <QueryError onRetry={() => void report.refetch()} />
          </div>
        ) : report.data && report.data.rows.length > 0 ? (
          <>
            <BenposeTable report={report.data} startIndex={firstRowNumber} />
            <PaginationBar
              page={report.data.pagination.page}
              pageSize={report.data.pagination.pageSize}
              total={report.data.pagination.totalRecords}
              totalPages={report.data.pagination.totalPages}
              onPageChange={(page) => setApplied({ ...applied, page })}
              isFetching={report.isFetching}
            />
          </>
        ) : (
          <EmptyState
            title="No results"
            body="No beneficial positions recorded for this date and depository."
          />
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
