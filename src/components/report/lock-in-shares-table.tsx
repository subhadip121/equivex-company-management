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
import type { LockInReport } from "@/api/company-reports"

export function LockInSharesSummary({ report }: { report: LockInReport }) {
  const tiles = [
    { label: "As on", value: formatDayMonthYear(report.uploadDate) },
    { label: "Share Capital", value: formatNumber(report.shareCapital) },
    { label: "No. of Holders", value: formatNumber(report.totals.holders) },
    { label: "Lock-in Shares", value: formatNumber(report.totals.lockInShares) },
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

export function LockInSharesTable({ report }: { report: LockInReport }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">No. of Holders</TableHead>
          <TableHead className="text-right">Total Shares</TableHead>
          <TableHead className="text-right">Lock-in Shares</TableHead>
          <TableHead className="text-right">% of Holding</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {report.rows.map((row) => (
          <TableRow key={row.code}>
            <TableCell className="max-w-xl whitespace-normal">
              <Badge variant="outline" className="mr-2 align-middle font-mono text-[10px]">
                {row.code}
              </Badge>
              {row.name}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(row.holders)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(row.totalShares)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(row.lockInShares)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercent(row.holdingPercentage)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell className="text-right tabular-nums">
            {formatNumber(report.totals.holders)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatNumber(report.totals.totalShares)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatNumber(report.totals.lockInShares)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatPercent(report.totals.holdingPercentage)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
