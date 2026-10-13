import { useMemo, useState } from "react"
import { AlertCircle, FileDown, FileSpreadsheet, Filter, Loader2, TableIcon } from "lucide-react"
import { toast } from "sonner"
import { CategoryMultiSelect } from "@/components/report/category-multi-select"
import { PaginationBar } from "@/components/layout/pagination-bar"
import { ReportTableSkeleton } from "@/components/report/report-data-table"
import {
  FolioDetailsDialog,
  type FolioTarget,
} from "@/components/report/folio-details-dialog"
import {
  ShareHoldingSummary,
  ShareHoldingTable,
} from "@/components/report/share-holding-table"
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
import {
  useDownloadShareHolding,
  useReportCategories,
  useReportDates,
  useShareHolding,
} from "@/hooks/use-company-reports"
import {
  DEFAULT_SHARE_HOLDING_KEYS,
  flattenCategories,
  SHARE_HOLDING_KEYS,
  toYmdDate,
} from "@/api/company-reports"
import { QueryError } from "@/pages/shared/query-error"
import type {
  CategoryGroup,
  ShareHoldingDepository,
  ShareHoldingRequest,
} from "@/api/company-reports"

const RANGE_OPTIONS = [50, 100, 200, 500, 1000]

/** Single-letter codes the endpoint expects, with readable names. */
const DEPOSITORY_OPTIONS: Array<{ value: ShareHoldingDepository; label: string }> = [
  { value: "A", label: "All" },
  { value: "N", label: "NSDL" },
  { value: "C", label: "CDSL" },
  { value: "P", label: "Physical" },
]
const PAGE_SIZE = 100

export function ShareHoldingReport() {
  const { user } = useAuth()
  const companyId = Number(user?.id)

  const categories = useReportCategories()
  const dates = useReportDates()

  const [chosenDate, setChosenDate] = useState<string | null>(null)
  const [chosenCategories, setChosenCategories] = useState<string[] | null>(null)
  const [range, setRange] = useState(100)
  const [depositoryType, setDepositoryType] = useState<ShareHoldingDepository>("A")
  const [keys, setKeys] = useState<string[]>(DEFAULT_SHARE_HOLDING_KEYS)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState<ShareHoldingRequest | null>(null)
  // Columns the user picked, which may omit the PAN the request carries.
  const [displayKeys, setDisplayKeys] = useState<string[]>(DEFAULT_SHARE_HOLDING_KEYS)
  const [folioTarget, setFolioTarget] = useState<FolioTarget | null>(null)

  // Columns reuse the category picker, as a single group.
  const keyGroups = useMemo<CategoryGroup[]>(
    () => [
      {
        label: "Columns",
        options: SHARE_HOLDING_KEYS.map((column) => ({
          value: column.value,
          label: column.label,
          group: "Columns",
        })),
      },
    ],
    [],
  )

  const allCategoryValues = flattenCategories(categories.data ?? []).map((option) => option.value)
  // Newest record date, every category, until the user chooses otherwise.
  // The picker accepts any date, so a value typed there will not be in the
  // list; back on the dropdown it falls to the first option rather than
  // showing an empty field.
  const dateOptions = dates.data?.map((option) => option.value) ?? []
  const isPhysical = depositoryType === "P"
  const date = isPhysical
    ? (chosenDate ?? dateOptions[0] ?? "")
    : chosenDate && dateOptions.includes(chosenDate)
      ? chosenDate
      : (dateOptions[0] ?? "")
  // The endpoint takes a list, so the single choice is sent as one entry.
  const selectedDates = date ? [date] : []
  const selectedCategories = chosenCategories ?? allCategoryValues

  const report = useShareHolding(applied)
  const { excel, pdf } = useDownloadShareHolding()
  const isDownloading = excel.isPending || pdf.isPending

  const canApply =
    selectedDates.length > 0 &&
    selectedCategories.length > 0 &&
    keys.length > 0 &&
    Number.isFinite(companyId)

  function buildRequest(page: number): ShareHoldingRequest | null {
    setError(null)
    if (!canApply) {
      setError("Choose at least one date, category and column.")
      return null
    }

    // The folio dialog looks up by PAN, so it is always requested even
    // when it is not one of the chosen columns.
    const requestKeys = keys.includes("pan1") ? keys : [...keys, "pan1"]

    return {
      companyId,
      dates: selectedDates,
      categories: selectedCategories,
      range,
      depositoryType,
      page,
      pageSize: PAGE_SIZE,
      keys: requestKeys,
    }
  }

  function apply() {
    const request = buildRequest(1)
    if (!request) return
    setDisplayKeys(keys)
    setApplied(request)
  }

  function runDownload(kind: "excel" | "pdf") {
    const request = buildRequest(1)
    if (!request) return

    const mutation = kind === "excel" ? excel : pdf
    mutation.mutate(request, { onError: (downloadError) => toast.error(downloadError.message) })
  }

  // Row numbers continue across pages rather than restarting at one.
  const firstRowNumber = report.data
    ? (report.data.pagination.page - 1) * report.data.pagination.pageSize + 1
    : 1

  return (
    <>
      <Card className="mb-3 py-0">
        <CardContent className="grid gap-3 p-3 lg:grid-cols-2 xl:grid-cols-4 xl:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="report-date" className="text-xs">
              Record date
            </Label>
            {/* Physical holdings are not tied to a benpose upload, so any
                date can be entered rather than picked from the list. */}
            {isPhysical ? (
              <Input
                id="report-date"
                type="date"
                value={toYmdDate(date)}
                onChange={(event) => setChosenDate(event.target.value)}
              />
            ) : dates.isPending ? (
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

          <div className="space-y-1.5">
            <Label className="text-xs">Columns</Label>
            <CategoryMultiSelect
              groups={keyGroups}
              selected={keys}
              onChange={setKeys}
              noun="columns"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="depository-type" className="text-xs">
              Depository
            </Label>
            <Select
              value={depositoryType}
              onValueChange={(value) => setDepositoryType(value as ShareHoldingDepository)}
            >
              <SelectTrigger id="depository-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPOSITORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-range" className="text-xs">
              Top range
            </Label>
            <Select value={String(range)} onValueChange={(value) => setRange(Number(value))}>
              <SelectTrigger id="report-range" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    Top {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2 lg:col-span-2 xl:col-span-4">
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
        <ShareHoldingSummary report={report.data} />
      ) : null}

      <Card className="overflow-hidden py-0">
        {!applied ? (
          <EmptyState
            title="Choose your filters"
            body="Pick the record dates, categories and columns, then get the results."
          />
        ) : report.isPending ? (
          <ReportTableSkeleton columns={keys.length + 1} />
        ) : report.isError ? (
          <div className="p-4">
            <QueryError onRetry={() => void report.refetch()} />
          </div>
        ) : report.data && report.data.rows.length > 0 ? (
          <>
            <ShareHoldingTable
              report={report.data}
              keys={displayKeys}
              startIndex={firstRowNumber}
              onOpenFolios={(pan) =>
                setFolioTarget({ companyId, pan, date: applied.dates[0] ?? "" })
              }
            />
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
            body="No holdings matched these dates and categories."
          />
        )}
      </Card>

      <FolioDetailsDialog target={folioTarget} onClose={() => setFolioTarget(null)} />
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
