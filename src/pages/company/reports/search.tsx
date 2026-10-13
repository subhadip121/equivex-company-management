import { useState } from "react"
import { AlertCircle, FileDown, FileSpreadsheet, Loader2, Search, TableIcon } from "lucide-react"
import { toast } from "sonner"
import { PaginationBar } from "@/components/layout/pagination-bar"
import { ReportTableSkeleton } from "@/components/report/report-data-table"
import {
  SearchResultsTable,
  SearchSummary,
} from "@/components/report/search-results-table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { useDownloadSearch, useReportDates, useSearch } from "@/hooks/use-company-reports"
import { QueryError } from "@/pages/shared/query-error"
import type { SearchRequest } from "@/api/company-reports"

const PAGE_SIZE = 200
/** The endpoint requires a keyword of at least this length. */
const MIN_KEYWORD_LENGTH = 3
export function SearchReport() {
  const { user } = useAuth()
  const companyId = Number(user?.id)

  const dates = useReportDates()

  const [keyword, setKeyword] = useState("")
  // Off by default: the search runs across every record date.
  const [includeDate, setIncludeDate] = useState(false)
  const [chosenDate, setChosenDate] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState<SearchRequest | null>(null)

  const date = chosenDate ?? dates.data?.[0]?.value ?? ""

  const report = useSearch(applied)
  const { excel, pdf } = useDownloadSearch()
  const isDownloading = excel.isPending || pdf.isPending

  const hasCompany = Number.isFinite(companyId) && companyId > 0
  const canSearch = keyword.trim().length >= MIN_KEYWORD_LENGTH && hasCompany

  function buildRequest(page: number): SearchRequest | null {
    setError(null)

    if (!hasCompany) {
      setError("Your company could not be identified. Sign out and in again.")
      return null
    }
    if (keyword.trim().length < MIN_KEYWORD_LENGTH) {
      setError(`Enter at least ${MIN_KEYWORD_LENGTH} characters to search.`)
      return null
    }
    if (includeDate && !date) {
      setError("Choose a record date, or set Include date to No.")
      return null
    }

    return {
      companyId,
      keyword: keyword.trim(),
      // An empty date tells the API to search across every date.
      date: includeDate ? date : "",
      page,
      pageSize: PAGE_SIZE,
    }
  }

  function runSearch() {
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
        {/* A flex row keeps every control on one baseline, whether or not
            the date field is showing. */}
        <CardContent className="flex flex-wrap items-end gap-3 p-3">
          <div className="min-w-64 flex-1 space-y-1.5">
            <Label htmlFor="search-keyword" className="text-xs">
              Search
              <span className="ml-1 font-normal text-muted-foreground">
                (at least {MIN_KEYWORD_LENGTH} characters)
              </span>
            </Label>
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search-keyword"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                // Enter is the natural way to run a search.
                onKeyDown={(event) => event.key === "Enter" && runSearch()}
                placeholder="Name, folio, PAN, email or address"
                className="pl-8"
              />
            </div>
          </div>

          <div className="w-32 space-y-1.5">
            <Label htmlFor="include-date" className="text-xs">
              Include date
            </Label>
            <Select
              value={includeDate ? "yes" : "no"}
              onValueChange={(value) => setIncludeDate(value === "yes")}
            >
              <SelectTrigger id="include-date" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* The date only matters once the search is limited to one. */}
          {includeDate ? (
            <div className="w-48 space-y-1.5">
              <Label htmlFor="search-date" className="text-xs">
                Record date
              </Label>
              {dates.isPending ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={date}
                  onValueChange={setChosenDate}
                  disabled={!dates.data?.length}
                >
                  <SelectTrigger id="search-date" className="w-full">
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
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              className="gap-2"
              disabled={!canSearch || report.isFetching}
              onClick={runSearch}
            >
              {report.isFetching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              {report.isFetching ? "Searching…" : "Search"}
            </Button>

            <Button
              variant="outline"
              size="icon"
              aria-label="Download Excel"
              title="Download Excel"
              disabled={!canSearch || isDownloading}
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
              disabled={!canSearch || isDownloading}
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

      {report.data && report.data.rows.length > 0 ? (
        <SearchSummary report={report.data} />
      ) : null}

      <Card className="overflow-hidden py-0">
        {!applied ? (
          <EmptyState
            title="Search the register"
            body="Enter a name, folio, PAN, email or address to find shareholders."
          />
        ) : report.isPending ? (
          <ReportTableSkeleton columns={9} />
        ) : report.isError ? (
          <div className="p-4">
            <QueryError onRetry={() => void report.refetch()} />
          </div>
        ) : report.data && report.data.rows.length > 0 ? (
          <>
            <SearchResultsTable report={report.data} startIndex={firstRowNumber} />
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
            title="No matches"
            body={`Nothing matched "${applied.keyword}" on the selected date.`}
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
