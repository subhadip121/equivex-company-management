import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { CompanyForm } from "@/components/company/company-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useCreateCompany } from "@/hooks/use-companies"

export function CreateCompanyDialog() {
  const [open, setOpen] = useState(false)
  const createCompany = useCreateCompany()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Add company
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add company</DialogTitle>
          <DialogDescription>
            Create a company account. The company signs in with its ISIN number.
          </DialogDescription>
        </DialogHeader>
        {/* Remounting on open clears any half-typed values from last time. */}
        {open ? (
          <CompanyForm
            mode="create"
            isPending={createCompany.isPending}
            submitLabel="Create company"
            pendingLabel="Creating…"
            onCancel={() => setOpen(false)}
            onSubmit={(values) =>
              createCompany.mutate(values, {
                onSuccess: () => {
                  toast.success(`${values.company_name} created`)
                  setOpen(false)
                },
                onError: (error) => toast.error(error.message),
              })
            }
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
