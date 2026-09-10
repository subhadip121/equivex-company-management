import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useChangeCompanyStatus } from "@/hooks/use-companies"

export interface StatusTarget {
  id: number
  name: string
  isActive: boolean
}

export function StatusConfirmDialog({
  target,
  onClose,
}: {
  target: StatusTarget | null
  onClose: () => void
}) {
  const changeStatus = useChangeCompanyStatus()
  const deactivating = target?.isActive ?? false

  function handleConfirm() {
    if (!target) return

    changeStatus.mutate(
      { id: target.id, active: !target.isActive },
      {
        onSuccess: () => {
          toast.success(`${target.name} ${deactivating ? "deactivated" : "activated"}`)
          onClose()
        },
        onError: (error) => toast.error(error.message),
      },
    )
  }

  return (
    <AlertDialog open={target !== null} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {deactivating ? "Deactivate this company?" : "Activate this company?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {deactivating
              ? `${target?.name} will no longer be able to sign in until reactivated.`
              : `${target?.name} will be able to sign in again.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={changeStatus.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="gap-2"
            disabled={changeStatus.isPending}
            onClick={(event) => {
              // Keep the dialog open while the request is in flight.
              event.preventDefault()
              handleConfirm()
            }}
          >
            {changeStatus.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {deactivating ? "Deactivate" : "Activate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
