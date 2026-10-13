import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatNumber } from "@/lib/format"
import type { BenposeReport } from "@/api/company-reports"

export function BenposeTable({
  report,
  startIndex,
}: {
  report: BenposeReport
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
          <TableHead>Address</TableHead>
          <TableHead className="text-right">Shares</TableHead>
          <TableHead className="text-right">Pledged</TableHead>
          <TableHead className="text-right">Lock-in</TableHead>
          <TableHead>Depository</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {report.rows.map((row, index) => (
          <TableRow key={row.id || `${row.folioId}-${index}`}>
            <TableCell className="text-right text-muted-foreground tabular-nums">
              {startIndex + index}
            </TableCell>

            <TableCell className="max-w-56">
              <p className="truncate font-medium">{row.name || "—"}</p>
              {row.status ? (
                <Badge variant="outline" className="mt-0.5 font-mono text-[10px]">
                  {row.status}
                </Badge>
              ) : null}
            </TableCell>

            <TableCell className="font-mono text-xs whitespace-nowrap">
              <p>{row.folioId || "—"}</p>
              {row.dpId ? <p className="text-muted-foreground">{row.dpId}</p> : null}
            </TableCell>

            <TableCell className="font-mono text-xs whitespace-nowrap">{row.pan1 || "—"}</TableCell>

            <TableCell className="max-w-64">
              <p className="truncate text-xs" title={row.address}>
                {row.address || "—"}
              </p>
              {row.pin ? <p className="text-xs text-muted-foreground">{row.pin}</p> : null}
            </TableCell>

            <TableCell className="text-right tabular-nums">{formatNumber(row.shares)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {row.pledgeShares ? formatNumber(row.pledgeShares) : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.lockShares ? formatNumber(row.lockShares) : "—"}
            </TableCell>

            <TableCell>
              <Badge variant="secondary">{row.depositoryType || "—"}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
