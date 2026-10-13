import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDayMonthYear, formatNumber, formatPercent } from "@/lib/format"
import type { SearchReport } from "@/api/company-reports"

export function SearchSummary({ report }: { report: SearchReport }) {
  const tiles = [
    { label: "Matches", value: formatNumber(report.pagination.totalRecords) },
    { label: "On this page", value: formatNumber(report.countInPage) },
    { label: "Shares on page", value: formatNumber(report.sharesInPage) },
    { label: "Page", value: `${report.pagination.page} of ${report.pagination.totalPages}` },
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

/** Each holder's details are grouped per cell, since there are many fields. */
export function SearchResultsTable({
  report,
  startIndex,
}: {
  report: SearchReport
  startIndex: number
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-right">#</TableHead>
          <TableHead>Holder</TableHead>
          <TableHead>Folio / DP</TableHead>
          <TableHead>PAN</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Address</TableHead>
          <TableHead className="text-right">Shares</TableHead>
          <TableHead className="text-right">% To Equity</TableHead>
          <TableHead className="whitespace-nowrap">Record date</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {report.rows.map((row, index) => (
          <TableRow key={`${row.folioId}-${row.insertDate}-${index}`}>
            <TableCell className="text-right text-muted-foreground tabular-nums">
              {startIndex + index}
            </TableCell>

            <TableCell className="max-w-56">
              <p className="truncate font-medium">{row.name || "—"}</p>
              {row.jointHolder2 || row.jointHolder1 ? (
                <p className="truncate text-xs text-muted-foreground">
                  with {[row.jointHolder1, row.jointHolder2].filter(Boolean).join(", ")}
                </p>
              ) : null}
              {row.fatherOrHusband ? (
                <p className="truncate text-xs text-muted-foreground">
                  F/H {row.fatherOrHusband}
                </p>
              ) : null}
            </TableCell>

            <TableCell className="font-mono text-xs whitespace-nowrap">
              <p>{row.folioId || "—"}</p>
              {row.dpId ? <p className="text-muted-foreground">{row.dpId}</p> : null}
            </TableCell>

            <TableCell className="font-mono text-xs whitespace-nowrap">
              <p>{row.pan1 || "—"}</p>
              {row.pan2 ? <p className="text-muted-foreground">{row.pan2}</p> : null}
            </TableCell>

            <TableCell className="max-w-48">
              <p className="truncate text-xs">{row.email || "—"}</p>
              {row.phone ? (
                <p className="truncate text-xs text-muted-foreground">{row.phone}</p>
              ) : null}
            </TableCell>

            <TableCell className="max-w-64">
              <p className="truncate text-xs" title={row.address}>
                {row.address || "—"}
              </p>
              {row.pin ? <p className="text-xs text-muted-foreground">{row.pin}</p> : null}
            </TableCell>

            <TableCell className="text-right tabular-nums">{formatNumber(row.shares)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercent(row.sharePercentage)}
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formatDayMonthYear(row.insertDate)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
