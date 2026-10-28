import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatNumber, formatPercent } from "@/lib/format"
import type { TopShareholdersReport } from "@/api/company-reports"

export function TopShareholdersSummary({
  report,
}: {
  report: TopShareholdersReport
}) {
  const totalSharesInView = report.rows.reduce(
    (acc, row) => acc + row.presentHolding,
    0,
  )
  const totalPercentageInView = report.rows.reduce(
    (acc, row) => acc + row.presentHoldingPercentage,
    0,
  )

  const tiles = [
    ...(report.shareCapital > 0
      ? [{ label: "Share Capital", value: formatNumber(report.shareCapital) }]
      : []),
    { label: "Top Range", value: `Top ${report.topN}` },
    { label: "Total Shares (In View)", value: formatNumber(totalSharesInView) },
    { label: "% To Equity (In View)", value: formatPercent(totalPercentageInView) },
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

export function TopShareholdersTable({
  report,
  startIndex = 1,
}: {
  report: TopShareholdersReport
  startIndex?: number
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14 text-center">#</TableHead>
          <TableHead>Shareholder Name</TableHead>
          <TableHead>FolioNo/DPID-CLID</TableHead>
          <TableHead>PAN</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Shares Held</TableHead>
          <TableHead className="text-right">% To Equity</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {report.rows.map((row, index) => (
          <TableRow key={`${row.clientId || row.folioId}-${row.pan}-${index}`}>
            <TableCell className="text-center font-mono text-xs text-muted-foreground">
              {startIndex + index}
            </TableCell>
            <TableCell className="font-medium whitespace-nowrap">
              {row.userName || "—"}
            </TableCell>
            <TableCell className="whitespace-nowrap font-mono text-xs">
              <span title={row.clientId || row.folioId || undefined}>
                {row.clientId || row.folioId || "—"}
              </span>
            </TableCell>
            <TableCell className="whitespace-nowrap font-mono text-xs">
              {row.pan || "—"}
            </TableCell>
            <TableCell className="max-w-xs whitespace-normal">
              {row.categoryCode ? (
                <Badge variant="outline" className="mr-1.5 font-mono text-[10px]">
                  {row.categoryCode}
                </Badge>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {row.categoryName || "—"}
              </span>
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatNumber(row.presentHolding)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercent(row.presentHoldingPercentage)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
