import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useFolioDetails } from "@/hooks/use-company-reports"
import { formatDayMonthYear, formatNumber } from "@/lib/format"
import { QueryError } from "@/pages/shared/query-error"

export interface FolioTarget {
  companyId: number
  pan: string
  date: string
}

/** Opened from a row whose folio cell reads "Multiple Folio ID". */
export function FolioDetailsDialog({
  target,
  onClose,
}: {
  target: FolioTarget | null
  onClose: () => void
}) {
  // Without a PAN there is nothing to look up, so the request is skipped
  // and the dialog explains why rather than failing silently.
  const canLookUp = Boolean(target?.pan)
  const details = useFolioDetails(canLookUp ? target : null)

  return (
    <Dialog open={target !== null} onOpenChange={(next) => !next && onClose()}>
      {/* Wide enough for the folio table, capped so it never fills the
          screen edge to edge. */}
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Folios for this holder</DialogTitle>
          <DialogDescription>
            {target ? (
              <>
                PAN <span className="font-mono">{target.pan}</span> as on{" "}
                {formatDayMonthYear(target.date)}
                {details.data ? ` · ${details.data.rowCount} folios` : null}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {!canLookUp ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            This row has no PAN, so its folios cannot be looked up.
          </p>
        ) : details.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : details.isError ? (
          <QueryError onRetry={() => void details.refetch()} />
        ) : details.data && details.data.rows.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio / Client ID</TableHead>
                  <TableHead>Holder</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.data.rows.map((row, index) => (
                  <TableRow key={`${row.clientId}-${index}`}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {row.clientId || "—"}
                    </TableCell>

                    <TableCell className="max-w-48">
                      <p className="truncate font-medium">{row.name || "—"}</p>
                      {row.jointHolder1 || row.jointHolder2 ? (
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

                    <TableCell className="max-w-40">
                      <p className="truncate text-xs">{row.email || "—"}</p>
                      {row.phone ? (
                        <p className="truncate text-xs text-muted-foreground">{row.phone}</p>
                      ) : null}
                    </TableCell>

                    <TableCell className="max-w-56">
                      <p className="truncate text-xs" title={row.address}>
                        {row.address || "—"}
                      </p>
                      {row.pin ? (
                        <p className="text-xs text-muted-foreground">{row.pin}</p>
                      ) : null}
                    </TableCell>

                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.shares)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No folios were returned for this holder.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
