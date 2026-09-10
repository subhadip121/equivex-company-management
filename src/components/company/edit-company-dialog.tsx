import { toast } from "sonner"
import { CompanyForm } from "@/components/company/company-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useCompany, useUpdateCompany } from "@/hooks/use-companies"
import { QueryError } from "@/pages/shared/query-error"
import type { Company, UpdateCompanyPayload } from "@/types"

function toFormValues(company: Company) {
  return {
    company_name: company.company_name ?? "",
    company_isin: company.company_isin ?? "",
    company_cin: company.company_cin ?? "",
    company_code: company.company_code ?? "",
    email: company.email ?? "",
    phone_no: company.phone_no ?? "",
    fax: company.fax ?? "",
    website: company.website ?? "",
    address: company.address ?? "",
  }
}

export function EditCompanyDialog({
  companyId,
  onClose,
}: {
  companyId: number | null
  onClose: () => void
}) {
  const company = useCompany(companyId)
  const updateCompany = useUpdateCompany(companyId ?? 0)

  return (
    <Dialog open={companyId !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit company</DialogTitle>
          <DialogDescription>
            The company code is set at creation and cannot be changed here.
          </DialogDescription>
        </DialogHeader>

        {company.isPending ? (
          <FormSkeleton />
        ) : company.isError ? (
          <QueryError onRetry={() => void company.refetch()} />
        ) : company.data ? (
          <CompanyForm
            // Remount when a different company is opened.
            key={company.data.id}
            mode="edit"
            initial={toFormValues(company.data)}
            isPending={updateCompany.isPending}
            submitLabel="Save changes"
            pendingLabel="Saving…"
            onCancel={onClose}
            onSubmit={(values) => {
              const { company_code: _code, ...payload } = values
              void _code
              updateCompany.mutate(payload as UpdateCompanyPayload, {
                onSuccess: () => {
                  toast.success("Company updated")
                  onClose()
                },
                onError: (error) => toast.error(error.message),
              })
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function FormSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}
