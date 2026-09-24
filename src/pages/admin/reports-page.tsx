import { useState } from "react"
import { FileText, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { PaginationBar } from "@/components/layout/pagination-bar"
import { UploadReportDialog } from "@/components/report/upload-report-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useReportLogs } from "@/hooks/use-reports"
import { QueryError } from "@/pages/shared/query-error"
import type { ReportLog } from "@/api/reports"

const PAGE_SIZE = 10
const COLUMNS = ["Company code", "File", "Uploaded", "Report type", "Status"]

const REPORT_TYPE_LABELS: Record<string, string> = {
  year_ending: "Year ending",
  agm: "AGM",
}

/** The log uses 1 for a completed upload and 0 for a failed one. */
function statusOf(status: number | null) {
  if (status === 1) return { label: "Success", failed: false }
  if (status === 0) return { label: "Failed", failed: true }
  return { label: "Unknown", failed: false }
}

function formatDate(value: string | null) {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AdminReportsPage() {
  const [page, setPage] = useState(1)
  const logs = useReportLogs(page, PAGE_SIZE)

  return (
    <>
      <PageHeader
        title="Upload report"
        description="Previous uploads of the NSDL, CDSL and physical share consolidated report."
        action={
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh"
              onClick={() => void logs.refetch()}
            >
              <RefreshCw className={logs.isFetching ? "size-4 animate-spin" : "size-4"} />
            </Button>
            <UploadReportDialog />
          </>
        }
      />

      <Card className="overflow-hidden py-0">
        {logs.isError ? (
          <div className="p-4">
            <QueryError onRetry={() => void logs.refetch()} />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  {COLUMNS.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.isPending ? (
                  <SkeletonRows />
                ) : logs.data && logs.data.items.length > 0 ? (
                  logs.data.items.map((log) => <LogRow key={log.id} log={log} />)
                ) : (
                  <TableRow>
                    <TableCell colSpan={COLUMNS.length}>
                      <EmptyState />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {logs.data ? (
              <PaginationBar
                page={logs.data.page}
                pageSize={logs.data.pageSize}
                total={logs.data.total}
                totalPages={logs.data.totalPages}
                onPageChange={setPage}
                isFetching={logs.isFetching}
              />
            ) : null}
          </>
        )}
      </Card>
    </>
  )
}

function LogRow({ log }: { log: ReportLog }) {
  const reportType = log.report_type ?? ""
  const status = statusOf(log.status)

  return (
    <TableRow>
      <TableCell className="font-mono text-xs whitespace-nowrap">
        {log.company_code ?? "—"}
      </TableCell>
      <TableCell className="max-w-72">
        <p className="truncate font-medium">{log.upload_file_name ?? "—"}</p>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {formatDate(log.upload_time)}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {REPORT_TYPE_LABELS[reportType.toLowerCase()] ?? (reportType || "—")}
      </TableCell>
      <TableCell>
        <Badge
          variant={status.failed ? "destructive" : "secondary"}
          // Failures carry the reason, which is too long for its own column.
          title={status.failed ? (log.reason_of_fail ?? undefined) : undefined}
        >
          {status.label}
        </Badge>
      </TableCell>
    </TableRow>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }, (_, row) => (
        <TableRow key={row}>
          {COLUMNS.map((column) => (
            <TableCell key={column}>
              <Skeleton className="h-4 w-full min-w-16" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="rounded-full bg-muted p-3">
        <FileText className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No reports uploaded yet</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Use Upload report to add the first consolidated report.
      </p>
    </div>
  )
}
