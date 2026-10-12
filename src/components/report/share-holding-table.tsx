import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatNumber, formatPercent, humaniseKey } from "@/lib/format"
import { SHARE_HOLDING_KEYS, type ShareHoldingReport } from "@/api/company-reports"

type ColumnSpec = {
  value: string
  label: string
  numeric?: boolean
  percentage?: boolean
}

function specFor(key: string): ColumnSpec {
  const known = SHARE_HOLDING_KEYS.find((column) => column.value === key)
  return known ?? { value: key, label: humaniseKey(key) }
}

export function ShareHoldingSummary({ report }: { report: ShareHoldingReport }) {
  const tiles = [
    { label: "Share Capital", value: formatNumber(report.shareCapital) },
    { label: "Top Range", value: formatNumber(report.range) },
    { label: "Total Shares", value: formatNumber(report.totalTopShares) },
    { label: "% To Equity", value: formatPercent(report.totalPercentage) },
  ]

  return (
    <Card className="mb-3 py-0">
      <CardContent className="grid grid-cols-2 divide-border p-0 sm:grid-cols-4 sm:divide-x">
        {tiles.map((tile) => (
          <div key={tile.label} className="px-4 py-3">
            <p className="truncate text-xs text-muted-foreground">{tile.label}</p>
            <p className="truncate text-lg font-semibold tracking-tight tabular-nums">
              {tile.value}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/** Columns follow the keys that were requested, in that order. */
export function ShareHoldingTable({
  report,
  keys,
  startIndex,
}: {
  report: ShareHoldingReport
  keys: string[]
  startIndex: number
}) {
  const columns = keys.map(specFor)

  function render(column: ColumnSpec, value: unknown) {
    if (value === null || value === undefined || value === "") return "—"
    if (column.percentage) return formatPercent(Number(value))
    if (column.numeric) return formatNumber(Number(value))
    return String(value)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-right">#</TableHead>
          {columns.map((column) => (
            <TableHead
              key={column.value}
              className={column.numeric || column.percentage ? "text-right" : undefined}
            >
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {report.rows.map((row, index) => (
          <TableRow key={index}>
            <TableCell className="text-right text-muted-foreground tabular-nums">
              {startIndex + index}
            </TableCell>
            {columns.map((column) => (
              <TableCell
                key={column.value}
                className={
                  column.numeric || column.percentage
                    ? "text-right tabular-nums"
                    : "max-w-56 truncate"
                }
              >
                {render(column, row[column.value])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
