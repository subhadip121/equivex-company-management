import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useCompany } from "@/hooks/use-companies"
import { toStatus } from "@/lib/status"
import { QueryError } from "@/pages/shared/query-error"
import type { Company } from "@/types"

export function CompanyDetailsDialog({
  companyId,
  onClose,
}: {
  companyId: number | null
  onClose: () => void
}) {
  const company = useCompany(companyId)

  return (
    <Dialog open={companyId !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{company.data?.company_name ?? "Company details"}</DialogTitle>
          <DialogDescription>Registered details held against this company.</DialogDescription>
        </DialogHeader>

        {company.isPending ? (
          <DetailsSkeleton />
        ) : company.isError ? (
          <QueryError onRetry={() => void company.refetch()} />
        ) : company.data ? (
          <Details company={company.data} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function Details({ company }: { company: Company }) {
  const status = toStatus(company.status)
  const rows: Array<{ label: string; value?: string; mono?: boolean }> = [
    { label: "ISIN", value: company.company_isin, mono: true },
    { label: "CIN", value: company.company_cin, mono: true },
    { label: "Company code", value: company.company_code },
    { label: "Email", value: company.email },
    { label: "Phone", value: company.phone_no },
    { label: "Fax", value: company.fax },
    { label: "Website", value: company.website },
    { label: "Address", value: company.address },
  ].filter((row) => Boolean(row.value))

  return (
    <dl className="divide-y">
      <div className="grid gap-1 py-3 first:pt-0 sm:grid-cols-3">
        <dt className="text-xs text-muted-foreground sm:text-sm">Status</dt>
        <dd className="sm:col-span-2">
          <Badge variant={status.isActive ? "secondary" : "outline"}>{status.label}</Badge>
        </dd>
      </div>
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1 py-3 last:pb-0 sm:grid-cols-3">
          <dt className="text-xs text-muted-foreground sm:text-sm">{row.label}</dt>
          <dd className={row.mono ? "font-mono text-sm break-words sm:col-span-2" : "text-sm break-words sm:col-span-2"}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function DetailsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="grid gap-1 sm:grid-cols-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-48 max-w-full sm:col-span-2" />
        </div>
      ))}
    </div>
  )
}
