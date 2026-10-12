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
import type { CapitalAnalysisReport } from "@/api/company-reports"

export function SummaryOfShareholdingSummary({
  report,
}: {
  report: CapitalAnalysisReport
}) {
  const tiles = [
    ...(report.shareCapital > 0
      ? [{ label: "Share Capital", value: formatNumber(report.shareCapital) }]
      : []),
    { label: "Total Holders", value: formatNumber(report.total.totalHolders) },
    { label: "Total Shares", value: formatNumber(report.total.totalShares) },
    { label: "% To Equity", value: formatPercent(report.total.totalEquity) },
  ]

  return (
    <Card className="mb-3 py-0">
      <CardContent
        className={`grid grid-cols-2 divide-border p-0 sm:divide-x ${
          tiles.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"
        }`}
      >
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

export function SummaryOfShareholdingTable({
  report,
}: {
  report: CapitalAnalysisReport
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mode</TableHead>
          <TableHead className="text-right">Total Holders</TableHead>
          <TableHead className="text-right">% of Holders</TableHead>
          <TableHead className="text-right">Total Shares</TableHead>
          <TableHead className="text-right">% To Equity</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {report.summary.map((row) => (
          <TableRow key={row.category}>
            <TableCell className="font-medium whitespace-nowrap">
              <Badge variant="outline" className="font-mono text-xs">
                {row.category}
              </Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(row.totHolders)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercent(row.holderPercentage)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(row.totShares)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercent(row.equity)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell className="font-semibold">Total</TableCell>
          <TableCell className="text-right font-semibold tabular-nums">
            {formatNumber(report.total.totalHolders)}
          </TableCell>
          <TableCell className="text-right font-semibold tabular-nums">
            {formatPercent(report.total.holderPercentage)}
          </TableCell>
          <TableCell className="text-right font-semibold tabular-nums">
            {formatNumber(report.total.totalShares)}
          </TableCell>
          <TableCell className="text-right font-semibold tabular-nums">
            {formatPercent(report.total.totalEquity)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
