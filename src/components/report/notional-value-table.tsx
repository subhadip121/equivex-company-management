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
import type { NotionalValueReport } from "@/api/company-reports"

export function NotionalValueSummary({ report }: { report: NotionalValueReport }) {
  const tiles = [
    { label: "As on", value: formatDayMonthYear(report.currentDate) },
    { label: "Face Value", value: formatNumber(report.faceValue) },
    { label: "No. of Holders", value: formatNumber(report.totalHolders) },
    { label: "Total Amount", value: formatNumber(report.totalAmount) },
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

export function NotionalValueTable({ report }: { report: NotionalValueReport }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Notional Value Range</TableHead>
          <TableHead className="text-right">No. of Holders</TableHead>
          <TableHead className="text-right">% of Holders</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">% of Amount</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {report.rows.map((row) => (
          <TableRow key={row.range}>
            <TableCell className="tabular-nums">{row.range}</TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(row.holders)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercent(row.holderPercentage)}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(row.amount)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercent(row.amountPercentage)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell className="text-right tabular-nums">
            {formatNumber(report.totalHolders)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatPercent(report.totalHolderPercentage)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatNumber(report.totalAmount)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatPercent(report.totalAmountPercentage)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
