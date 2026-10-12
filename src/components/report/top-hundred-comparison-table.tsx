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
import type { TopHundredReport } from "@/api/company-reports"

export function TopHundredSummary({
  report,
  date1,
  date2,
}: {
  report: TopHundredReport
  date1: string
  date2: string
}) {
  const tiles = [
    { label: "Share Capital", value: formatNumber(report.shareCapital) },
    { label: "Shareholders", value: formatNumber(report.count) },
    { label: `As on ${formatDayMonthYear(date1)}`, value: formatNumber(report.totals.holding1) },
    { label: `As on ${formatDayMonthYear(date2)}`, value: formatNumber(report.totals.holding2) },
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

export function TopHundredTable({
  report,
  date1,
  date2,
}: {
  report: TopHundredReport
  date1: string
  date2: string
}) {
  return (
    <Table>
      <TableHeader>
        {/* Two header rows: the date each pair of figures belongs to, with
            the traded amounts between them. */}
        <TableRow>
          <TableHead rowSpan={2}>Shareholder</TableHead>
          <TableHead rowSpan={2}>Category</TableHead>
          <TableHead colSpan={2} className="border-l text-center">
            As on {formatDayMonthYear(date1)}
          </TableHead>
          <TableHead colSpan={2} className="border-l text-center">
            Traded
          </TableHead>
          <TableHead colSpan={2} className="border-l text-center">
            As on {formatDayMonthYear(date2)}
          </TableHead>
        </TableRow>
        <TableRow>
          <TableHead className="border-l text-right">Shares</TableHead>
          <TableHead className="text-right">% To Equity</TableHead>
          <TableHead className="border-l text-right">Buying</TableHead>
          <TableHead className="text-right">Selling</TableHead>
          <TableHead className="border-l text-right">Shares</TableHead>
          <TableHead className="text-right">% To Equity</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {report.rows.map((row, index) => (
          <TableRow key={`${row.pan}-${row.clientId}-${index}`}>
            <TableCell className="max-w-56">
              <p className="truncate font-medium">{row.name || "—"}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {[row.dpId, row.clientId].filter(Boolean).join(" / ") || row.pan}
              </p>
            </TableCell>

            <TableCell className="max-w-48">
              {row.categoryCode ? (
                <Badge variant="outline" className="mr-1.5 align-middle font-mono text-[10px]">
                  {row.categoryCode}
                </Badge>
              ) : null}
              <span className="text-xs text-muted-foreground">{row.categoryName}</span>
            </TableCell>

            <TableCell className="border-l text-right tabular-nums">
              {formatNumber(row.holding1)}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatPercent(row.equity1)}</TableCell>

            <TableCell className="border-l text-right tabular-nums text-accent-green">
              {row.buying ? formatNumber(row.buying) : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums text-destructive">
              {row.selling ? formatNumber(row.selling) : "—"}
            </TableCell>

            <TableCell className="border-l text-right tabular-nums">
              {formatNumber(row.holding2)}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatPercent(row.equity2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="border-l text-right tabular-nums">
            {formatNumber(report.totals.holding1)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatPercent(report.totals.equity1)}
          </TableCell>
          <TableCell className="border-l text-right tabular-nums">
            {formatNumber(report.totals.buying)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatNumber(report.totals.selling)}
          </TableCell>
          <TableCell className="border-l text-right tabular-nums">
            {formatNumber(report.totals.holding2)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatPercent(report.totals.equity2)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
