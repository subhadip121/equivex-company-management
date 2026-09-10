import { useState } from "react"
import { Building2, RefreshCw } from "lucide-react"
import { ChangeCompanyPasswordDialog } from "@/components/company/change-password-dialog"
import { CompanyDetailsDialog } from "@/components/company/company-details-dialog"
import { CompanyRowActions } from "@/components/company/company-row-actions"
import { CreateCompanyDialog } from "@/components/company/create-company-dialog"
import { EditCompanyDialog } from "@/components/company/edit-company-dialog"
import {
  StatusConfirmDialog,
  type StatusTarget,
} from "@/components/company/status-confirm-dialog"
import { PageHeader } from "@/components/layout/page-header"
import { PaginationBar } from "@/components/layout/pagination-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCompanyList } from "@/hooks/use-companies"
import { toStatus } from "@/lib/status"
import { QueryError } from "@/pages/shared/query-error"
import type { Company } from "@/types"

const PAGE_SIZE = 10
const COLUMNS = ["Company", "ISIN", "CIN", "Code", "Contact", "Status", "Action"]

export function CompaniesPage() {
  const [page, setPage] = useState(1)
  const list = useCompanyList(page, PAGE_SIZE)

  const [viewId, setViewId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [passwordTarget, setPasswordTarget] = useState<{ id: number; name: string } | null>(null)
  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null)

  return (
    <>
      <PageHeader
        title="Companies"
        description="Create and manage company accounts."
        action={
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh"
              onClick={() => void list.refetch()}
            >
              <RefreshCw className={list.isFetching ? "size-4 animate-spin" : "size-4"} />
            </Button>
            <CreateCompanyDialog />
          </>
        }
      />

      <Card className="overflow-hidden py-0">
        {list.isError ? (
          <div className="p-4">
            <QueryError onRetry={() => void list.refetch()} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {COLUMNS.map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.isPending ? (
                    <SkeletonRows />
                  ) : list.data && list.data.items.length > 0 ? (
                    list.data.items.map((company) => (
                      <CompanyRow
                        key={company.id ?? company.company_isin}
                        company={company}
                        onView={() => setViewId(company.id)}
                        onEdit={() => setEditId(company.id)}
                        onChangePassword={() =>
                          setPasswordTarget({ id: company.id, name: company.company_name })
                        }
                        onToggleStatus={(isActive) =>
                          setStatusTarget({
                            id: company.id,
                            name: company.company_name,
                            isActive,
                          })
                        }
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={COLUMNS.length}>
                        <EmptyState />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {list.data ? (
              <PaginationBar
                page={list.data.page}
                pageSize={list.data.pageSize}
                total={list.data.total}
                totalPages={list.data.totalPages}
                onPageChange={setPage}
                isFetching={list.isFetching}
              />
            ) : null}
          </>
        )}
      </Card>

      <CompanyDetailsDialog companyId={viewId} onClose={() => setViewId(null)} />
      <EditCompanyDialog companyId={editId} onClose={() => setEditId(null)} />
      <ChangeCompanyPasswordDialog
        company={passwordTarget}
        onClose={() => setPasswordTarget(null)}
      />
      <StatusConfirmDialog target={statusTarget} onClose={() => setStatusTarget(null)} />
    </>
  )
}

function CompanyRow({
  company,
  onView,
  onEdit,
  onChangePassword,
  onToggleStatus,
}: {
  company: Company
  onView: () => void
  onEdit: () => void
  onChangePassword: () => void
  onToggleStatus: (isActive: boolean) => void
}) {
  const status = toStatus(company.status)

  return (
    <TableRow>
      <TableCell className="max-w-64">
        <p className="truncate font-medium">{company.company_name}</p>
        {company.website ? (
          <p className="truncate text-xs text-muted-foreground">{company.website}</p>
        ) : null}
      </TableCell>
      <TableCell className="font-mono text-xs whitespace-nowrap">{company.company_isin}</TableCell>
      <TableCell className="font-mono text-xs whitespace-nowrap">{company.company_cin}</TableCell>
      <TableCell className="whitespace-nowrap">{company.company_code}</TableCell>
      <TableCell className="max-w-56">
        <p className="truncate text-sm">{company.email}</p>
        <p className="truncate text-xs text-muted-foreground">{company.phone_no}</p>
      </TableCell>
      <TableCell>
        <Badge variant={status.isActive ? "secondary" : "outline"}>{status.label}</Badge>
      </TableCell>
      <TableCell className="w-10">
        <CompanyRowActions
          company={company}
          isActive={status.isActive}
          onView={onView}
          onEdit={onEdit}
          onChangePassword={onChangePassword}
          onToggleStatus={() => onToggleStatus(status.isActive)}
        />
      </TableCell>
    </TableRow>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }, (_, row) => (
        <TableRow key={row}>
          {COLUMNS.map((column) => (
            <TableCell key={column}>
              <Skeleton className="h-4 w-full min-w-16" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="rounded-full bg-muted p-3">
        <Building2 className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No companies yet</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Use Add company to create the first company account.
      </p>
    </div>
  )
}
