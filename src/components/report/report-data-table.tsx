import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ReportRow } from "@/api/company-reports"

/** company_code -> Company code */
function humanise(key: string) {
  const spaced = key.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function render(value: unknown) {
  if (value === null || value === undefined || value === "") return "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

/**
 * Columns come from the rows themselves, so the table works before the
 * report's exact fields are known. Numbers align right.
 */
export function ReportDataTable({ rows }: { rows: ReportRow[] }) {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column}>{humanise(column)}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index}>
            {columns.map((column) => (
              <TableCell
                key={column}
                className={typeof row[column] === "number" ? "text-right tabular-nums" : undefined}
              >
                {render(row[column])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function ReportTableSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }, (_, row) => (
        <div key={row} className="flex gap-3">
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
