import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDayMonthYear, formatNumber, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ConsolidatedChangeReport } from "@/api/company-reports"

/** Gains read green, losses red, no movement stays muted. */
function Delta({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "tabular-nums",
        value > 0 && "text-accent-green",
        value < 0 && "text-destructive",
        value === 0 && "text-muted-foreground",
      )}
    >
      {value > 0 ? "+" : ""}
      {formatNumber(value)}
    </span>
  )
}

export function ConsolidatedChangeSummary({ report }: { report: ConsolidatedChangeReport }) {
  const tiles = [
    { label: "Share Capital", value: formatNumber(report.shareCapital) },
    { label: `As on ${formatDayMonthYear(report.fromDate)}`, value: formatNumber(report.totals.fromHolding) },
    { label: `As on ${formatDayMonthYear(report.toDate)}`, value: formatNumber(report.totals.toHolding) },
  ]

  return (
    <Card className="mb-3 py-0">
      <CardContent className="grid grid-cols-2 divide-border p-0 sm:grid-cols-4 sm:divide-x">
        {tiles.map((tile) => (
          <div key={tile.label} className="px-4 py-3">
            <p className="truncate text-xs text-muted-foreground">{tile.label}</p>
            <p className="text-lg font-semibold tracking-tight tabular-nums">{tile.value}</p>
          </div>
        ))}
        <div className="px-4 py-3">
          <p className="truncate text-xs text-muted-foreground">Change in shares</p>
          <p className="text-lg font-semibold tracking-tight">
            <Delta value={report.totals.differenceHolding} />
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ConsolidatedChangeTable({ report }: { report: ConsolidatedChangeReport }) {
  const fromLabel = formatDayMonthYear(report.fromDate)
  const toLabel = formatDayMonthYear(report.toDate)

  return (
    <Table>
      <TableHeader>
        {/* Two header rows: the date each block of figures belongs to, then
            the measures within it. */}
        <TableRow>
          <TableHead rowSpan={2}>Category</TableHead>
          <TableHead colSpan={3} className="border-l text-center">
            As on {fromLabel}
          </TableHead>
          <TableHead colSpan={3} className="border-l text-center">
            As on {toLabel}
          </TableHead>
          <TableHead colSpan={2} className="border-l text-center">
            Difference
          </TableHead>
        </TableRow>
        <TableRow>
          <TableHead className="border-l text-right">No. of Holders</TableHead>
          <TableHead className="text-right">Total Shares</TableHead>
          <TableHead className="text-right">% To Equity</TableHead>
          <TableHead className="border-l text-right">No. of Holders</TableHead>
          <TableHead className="text-right">Total Shares</TableHead>
          <TableHead className="text-right">% To Equity</TableHead>
          <TableHead className="border-l text-right">No. of Holders</TableHead>
          <TableHead className="text-right">Total Shares</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {report.rows.map((row) => (
          <TableRow key={row.code}>
            <TableCell className="max-w-xs whitespace-normal">
              <Badge variant="outline" className="mr-2 align-middle font-mono text-[10px]">
                {row.code}
              </Badge>
              {row.name}
            </TableCell>

            <TableCell className="border-l text-right tabular-nums">
              {formatNumber(row.from.cases)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(row.from.holding)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercent(row.from.percentage)}
            </TableCell>

            <TableCell className="border-l text-right tabular-nums">
              {formatNumber(row.to.cases)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(row.to.holding)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercent(row.to.percentage)}
            </TableCell>

            <TableCell className="border-l text-right">
              <Delta value={row.differenceCases} />
            </TableCell>
            <TableCell className="text-right">
              <Delta value={row.differenceHolding} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell className="border-l text-right tabular-nums">
            {formatNumber(report.totals.fromCases)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatNumber(report.totals.fromHolding)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatPercent(report.totals.fromPercentage)}
          </TableCell>
          <TableCell className="border-l text-right tabular-nums">
            {formatNumber(report.totals.toCases)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatNumber(report.totals.toHolding)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatPercent(report.totals.toPercentage)}
          </TableCell>
          <TableCell className="border-l text-right">
            <Delta value={report.totals.differenceCases} />
          </TableCell>
          <TableCell className="text-right">
            <Delta value={report.totals.differenceHolding} />
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
