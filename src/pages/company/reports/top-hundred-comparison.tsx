import { useMemo, useState } from "react"
import { AlertCircle, FileDown, FileSpreadsheet, Filter, Loader2, TableIcon } from "lucide-react"
import { toast } from "sonner"
import { CategoryMultiSelect } from "@/components/report/category-multi-select"
import { ReportTableSkeleton } from "@/components/report/report-data-table"
import {
  TopHundredSummary,
  TopHundredTable,
} from "@/components/report/top-hundred-comparison-table"
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
  useDownloadTopHundredComparison,
  useReportCategories,
  useReportDates,
  useTopHundredComparison,
} from "@/hooks/use-company-reports"
import { PROMOTER_GROUP_CATEGORY } from "@/api/company-reports"
import { QueryError } from "@/pages/shared/query-error"
import type { CategoryGroup, TopHundredRequest } from "@/api/company-reports"

export function TopHundredComparisonReport() {
  const { user } = useAuth()
  const companyId = Number(user?.id)

  const categories = useReportCategories()
  const dates = useReportDates()

  const [chosenDate1, setChosenDate1] = useState<string | null>(null)
  const [chosenDate2, setChosenDate2] = useState<string | null>(null)
  const [chosenCategories, setChosenCategories] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState<TopHundredRequest | null>(null)

  // This endpoint accepts a combined promoter grouping as well as codes.
  const groups = useMemo<CategoryGroup[]>(
    () => [
      {
        label: "Grouping",
        options: [
          {
            value: PROMOTER_GROUP_CATEGORY,
            label: "Promoter & Promoter Group",
            group: "Grouping",
          },
        ],
      },
      ...(categories.data ?? []),
    ],
    [categories.data],
  )

  const date1 = chosenDate1 ?? dates.data?.[0]?.value ?? ""
  const date2 = chosenDate2 ?? dates.data?.[1]?.value ?? ""
  // Nothing is selected until the user picks, so the report is deliberate.
  const selectedCategories = chosenCategories ?? []

  const report = useTopHundredComparison(applied)
  const { excel, pdf } = useDownloadTopHundredComparison()
  const isDownloading = excel.isPending || pdf.isPending

  const canApply =
    Boolean(date1) && Boolean(date2) && selectedCategories.length > 0 && Number.isFinite(companyId)

  function buildRequest(): TopHundredRequest | null {
    setError(null)
    if (!canApply) return null

    if (date1 === date2) {
      setError("Choose two different dates to compare.")
      return null
    }

    return { companyId, date1, date2, categories: selectedCategories }
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
        <CardContent className="grid gap-3 p-3 lg:grid-cols-[minmax(0,12rem)_minmax(0,12rem)_minmax(0,1fr)_auto] lg:items-end">
          <DateField
            id="date-1"
            label="Date 1"
            value={date1}
            onChange={setChosenDate1}
            options={dates.data}
            isLoading={dates.isPending}
          />

          <DateField
            id="date-2"
            label="Date 2"
            value={date2}
            onChange={setChosenDate2}
            options={dates.data}
            isLoading={dates.isPending}
          />

          <div className="space-y-1.5">
            <Label className="text-xs">Select category</Label>
            <CategoryMultiSelect
              groups={groups}
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

      {applied && report.data && report.data.rows.length > 0 ? (
        <TopHundredSummary report={report.data} date1={applied.date1} date2={applied.date2} />
      ) : null}

      <Card className="overflow-hidden py-0">
        {!applied ? (
          <EmptyState
            title="Choose your filters"
            body="Pick two dates to compare and the categories to include, then get the results."
          />
        ) : report.isPending ? (
          <ReportTableSkeleton columns={8} />
        ) : report.isError ? (
          <div className="p-4">
            <QueryError onRetry={() => void report.refetch()} />
          </div>
        ) : report.data && report.data.rows.length > 0 ? (
          <TopHundredTable report={report.data} date1={applied.date1} date2={applied.date2} />
        ) : (
          <EmptyState
            title="No results"
            body="No shareholders matched these dates and categories."
          />
        )}
      </Card>
    </>
  )
}

function DateField({
  id,
  label,
  value,
  onChange,
  options,
  isLoading,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options?: Array<{ value: string; label: string }>
  isLoading: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <Select value={value} onValueChange={onChange} disabled={!options?.length}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Select date" />
          </SelectTrigger>
          <SelectContent>
            {options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
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
