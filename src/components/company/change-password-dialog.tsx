import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useChangeCompanyPassword } from "@/hooks/use-companies"

const MIN_PASSWORD_LENGTH = 8

export function ChangeCompanyPasswordDialog({
  company,
  onClose,
}: {
  company: { id: number; name: string } | null
  onClose: () => void
}) {
  return (
    <Dialog open={company !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set a new password</DialogTitle>
          <DialogDescription>
            {company ? `This replaces the sign-in password for ${company.name}.` : null}
          </DialogDescription>
        </DialogHeader>
        {company ? <PasswordForm company={company} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function PasswordForm({
  company,
  onClose,
}: {
  company: { id: number; name: string }
  onClose: () => void
}) {
  const changePassword = useChangeCompanyPassword()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`The password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.")
      return
    }

    changePassword.mutate(
      { id: company.id, newPassword },
      {
        onSuccess: () => {
          toast.success(`Password changed for ${company.name}`)
          onClose()
        },
        onError: (mutationError) => setError(mutationError.message),
      },
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="new_password">New password</Label>
        <Input
          id="new_password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm password</Label>
        <Input
          id="confirm_password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="gap-2" disabled={changePassword.isPending}>
          {changePassword.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {changePassword.isPending ? "Saving…" : "Change password"}
        </Button>
      </DialogFooter>
    </form>
  )
}
