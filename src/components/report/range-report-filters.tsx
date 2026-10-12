import { FileDown, FileSpreadsheet, Filter, Loader2 } from "lucide-react"
import { HoldingRangeEditor } from "@/components/report/holding-range-editor"
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
import type { RangeDraft } from "@/lib/holding-ranges"
import type { FilterOption } from "@/api/company-reports"

/**
 * Filter card shared by the two distribution schedules: the bands first,
 * then the date and the actions beneath them.
 */
export function RangeReportFilters({
  dates,
  datesLoading,
  date,
  onDateChange,
  ranges,
  onRangesChange,
  onSubmit,
  onDownload,
  canSubmit,
  isFetching,
  isExcelPending,
  isPdfPending,
}: {
  dates?: FilterOption[]
  datesLoading: boolean
  date: string
  onDateChange: (value: string) => void
  ranges: RangeDraft[]
  onRangesChange: (ranges: RangeDraft[]) => void
  onSubmit: () => void
  onDownload: (kind: "excel" | "pdf") => void
  canSubmit: boolean
  isFetching: boolean
  isExcelPending: boolean
  isPdfPending: boolean
}) {
  const isDownloading = isExcelPending || isPdfPending

  return (
    <Card className="mb-3 py-0">
      <CardContent className="space-y-3 p-3">
        <HoldingRangeEditor
          ranges={ranges}
          onChange={onRangesChange}
          disabled={isFetching || isDownloading}
        />

        <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="report-date" className="text-xs">
              Date
            </Label>
            {datesLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={date} onValueChange={onDateChange} disabled={!dates?.length}>
                <SelectTrigger id="report-date" className="w-full">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {dates?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" disabled={!canSubmit || isFetching} onClick={onSubmit}>
              {isFetching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Filter className="size-4" />
              )}
              {isFetching ? "Loading…" : "Get results"}
            </Button>

            <Button
              variant="outline"
              size="icon"
              aria-label="Download Excel"
              title="Download Excel"
              disabled={!canSubmit || isDownloading}
              onClick={() => onDownload("excel")}
            >
              {isExcelPending ? (
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
              disabled={!canSubmit || isDownloading}
              onClick={() => onDownload("pdf")}
            >
              {isPdfPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileDown className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
