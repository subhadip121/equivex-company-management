import { useState } from "react"
import { AlertCircle, FileDown, FileSpreadsheet, Filter, Loader2, TableIcon } from "lucide-react"
import { toast } from "sonner"
import { CategoryMultiSelect } from "@/components/report/category-multi-select"
import {
  PledgeSharesSummary,
  PledgeSharesTable,
} from "@/components/report/pledge-shares-table"
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
import {
  useDownloadPledgeShares,
  usePledgeShares,
  useReportCategories,
  useReportDates,
} from "@/hooks/use-company-reports"
import { flattenCategories } from "@/api/company-reports"
import { QueryError } from "@/pages/shared/query-error"
import type { LockInRequest } from "@/api/company-reports"

export function PledgeSharesSummaryReport() {
  const { user } = useAuth()
  const companyId = Number(user?.id)

  const categories = useReportCategories()
  const dates = useReportDates()

  const [chosenDate, setChosenDate] = useState<string | null>(null)
  const [chosenCategories, setChosenCategories] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState<LockInRequest | null>(null)

  const allCategoryValues = flattenCategories(categories.data ?? []).map((option) => option.value)
  const date = chosenDate ?? dates.data?.[0]?.value ?? ""
  const selectedCategories = chosenCategories ?? allCategoryValues

  const report = usePledgeShares(applied)
  const { excel, pdf } = useDownloadPledgeShares()
  const isDownloading = excel.isPending || pdf.isPending

  const canApply =
    Boolean(date) && selectedCategories.length > 0 && Number.isFinite(companyId)

  function buildRequest(): LockInRequest | null {
    setError(null)
    if (!canApply) return null
    return { companyId, date, categories: selectedCategories }
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
      <Card className="mb-3 py-0">
        <CardContent className="grid gap-3 p-3 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="report-date" className="text-xs">
              Date
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

          <div className="space-y-1.5">
            <Label className="text-xs">Select category</Label>
            <CategoryMultiSelect
              groups={categories.data ?? []}
              selected={selectedCategories}
              onChange={setChosenCategories}
              isLoading={categories.isPending}
            />
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

      {categories.isError || dates.isError ? (
        <div className="mb-3">
          <QueryError
            message="The filter options could not be loaded."
            onRetry={() => {
              void categories.refetch()
              void dates.refetch()
            }}
          />
        </div>
      ) : null}

      {report.data && report.data.rows.length > 0 ? (
        <PledgeSharesSummary report={report.data} />
      ) : null}

      <Card className="overflow-hidden py-0">
        {!applied ? (
          <EmptyState
            title="Choose your filters"
            body="Pick a date and the categories to include, then get the results."
          />
        ) : report.isPending ? (
          <ReportTableSkeleton columns={5} />
        ) : report.isError ? (
          <div className="p-4">
            <QueryError onRetry={() => void report.refetch()} />
          </div>
        ) : report.data && report.data.rows.length > 0 ? (
          <PledgeSharesTable report={report.data} />
        ) : (
          <EmptyState
            title="No results"
            body="No pledged shares recorded for these categories."
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
