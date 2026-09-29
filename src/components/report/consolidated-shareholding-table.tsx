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
import { formatNumber, formatPercent } from "@/lib/format"
import type { ConsolidatedShareholdingReport } from "@/api/company-reports"

export function ConsolidatedShareholdingSummary({
  report,
}: {
  report: ConsolidatedShareholdingReport
}) {
  // Labels mirror the table headers, so a tile and its column read the same.
  const tiles = [
    { label: "Share Capital", value: formatNumber(report.shareCapital) },
    { label: "No. of Holders", value: formatNumber(report.totalCases) },
    { label: "Total Shares", value: formatNumber(report.totalHolding) },
    { label: "% To Equity", value: formatPercent(report.totalPercentage) },
  ]

  // One divided strip rather than four cards, so the table stays high up.
  return (
    <Card className="mb-3 py-0">
      <CardContent className="grid grid-cols-2 divide-border p-0 sm:grid-cols-4 sm:divide-x">
        {tiles.map((tile) => (
          <div key={tile.label} className="px-4 py-3">
            <p className="truncate text-xs text-muted-foreground">{tile.label}</p>
            <p className="text-lg font-semibold tracking-tight tabular-nums">{tile.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ConsolidatedShareholdingTable({
  report,
}: {
  report: ConsolidatedShareholdingReport
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">No. of Holders</TableHead>
          <TableHead className="text-right">Total Shares</TableHead>
          <TableHead className="text-right">% To Equity</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {report.rows.map((row) => (
          <TableRow key={row.code}>
            {/* Code rides with the name, since the header is one column.
                Some category names run very long, so this cell wraps. */}
            <TableCell className="max-w-xl whitespace-normal">
              <Badge variant="outline" className="mr-2 align-middle font-mono text-[10px]">
                {row.code}
              </Badge>
              {row.name}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(row.cases)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(row.holding)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercent(row.percentage)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell className="text-right tabular-nums">
            {formatNumber(report.totalCases)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatNumber(report.totalHolding)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatPercent(report.totalPercentage)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
