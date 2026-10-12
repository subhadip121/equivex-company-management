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
import type { PledgeReport } from "@/api/company-reports"

export function PledgeSharesSummary({ report }: { report: PledgeReport }) {
  const tiles = [
    { label: "As on", value: formatDayMonthYear(report.uploadDate) },
    { label: "No. of Holders", value: formatNumber(report.totals.holders) },
    { label: "Pledge Shares", value: formatNumber(report.totals.pledgeShares) },
    { label: "% Pledged", value: formatPercent(report.totals.pledgePercentage) },
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

export function PledgeSharesTable({ report }: { report: PledgeReport }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">No. of Holders</TableHead>
          <TableHead className="text-right">Total Shares</TableHead>
          <TableHead className="text-right">Pledge Shares</TableHead>
          <TableHead className="text-right">% Pledged</TableHead>
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
              {formatNumber(row.pledgeShares)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercent(row.pledgePercentage)}
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
            {formatNumber(report.totals.pledgeShares)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatPercent(report.totals.pledgePercentage)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
