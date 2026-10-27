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
import { MULTIPLE_FOLIO_LABEL, type OnePercentShareholdersReport } from "@/api/company-reports"

export function OnePercentShareholdersSummary({
  report,
}: {
  report: OnePercentShareholdersReport
}) {
  const tiles = [
    ...(report.shareCapital > 0
      ? [{ label: "Share Capital", value: formatNumber(report.shareCapital) }]
      : []),
    { label: "Total Shareholders", value: formatNumber(report.totals.totalRecords) },
    { label: "Total Shares Held", value: formatNumber(report.totals.totalPresentHolding) },
    { label: "% To Equity", value: formatPercent(report.totals.totalEquity) },
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

export function OnePercentShareholdersTable({
  report,
  startIndex = 1,
  onOpenFolios,
}: {
  report: OnePercentShareholdersReport
  startIndex?: number
  onOpenFolios?: (pan: string) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14 text-center">#</TableHead>
          <TableHead>Shareholder Name</TableHead>
          <TableHead>Folio / Client ID</TableHead>
          <TableHead>PAN</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Previous Holding</TableHead>
          <TableHead className="text-right">Buying</TableHead>
          <TableHead className="text-right">Selling</TableHead>
          <TableHead className="text-right">Present Holding</TableHead>
          <TableHead className="text-right">% To Equity</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {report.rows.map((row, index) => {
          const isMultipleFolio =
            row.clientId.trim().toLowerCase() === MULTIPLE_FOLIO_LABEL.toLowerCase() ||
            row.folioId.trim().toLowerCase() === MULTIPLE_FOLIO_LABEL.toLowerCase()

          return (
            <TableRow key={`${row.folioId}-${row.pan}-${index}`}>
              <TableCell className="text-center font-mono text-xs text-muted-foreground">
                {startIndex + index}
              </TableCell>
              <TableCell className="font-medium whitespace-nowrap">
                {row.userName || "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-xs">
                {isMultipleFolio ? (
                  <button
                    type="button"
                    onClick={() => onOpenFolios?.(row.pan)}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {MULTIPLE_FOLIO_LABEL}
                  </button>
                ) : (
                  <span title={`Folio: ${row.folioId} | DP ID: ${row.dpId} | Client ID: ${row.clientId}`}>
                    {row.folioId || row.clientId || "—"}
                  </span>
                )}
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
              <TableCell className="text-right tabular-nums">
                {formatNumber(row.previousHolding)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                {row.buying > 0 ? `+${formatNumber(row.buying)}` : formatNumber(row.buying)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-rose-600 dark:text-rose-400">
                {row.selling > 0 ? `-${formatNumber(row.selling)}` : formatNumber(row.selling)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatNumber(row.presentHolding)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPercent(row.presentHoldingPercentage)}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={5} className="font-semibold">
            Total
          </TableCell>
          <TableCell className="text-right font-semibold tabular-nums">
            {formatNumber(report.totals.totalPreviousHolding)}
          </TableCell>
          <TableCell className="text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {report.totals.totalBuying > 0 ? `+${formatNumber(report.totals.totalBuying)}` : "0"}
          </TableCell>
          <TableCell className="text-right font-semibold tabular-nums text-rose-600 dark:text-rose-400">
            {report.totals.totalSelling > 0 ? `-${formatNumber(report.totals.totalSelling)}` : "0"}
          </TableCell>
          <TableCell className="text-right font-semibold tabular-nums">
            {formatNumber(report.totals.totalPresentHolding)}
          </TableCell>
          <TableCell className="text-right font-semibold tabular-nums">
            {formatPercent(report.totals.totalEquity)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
