import { useState } from "react"
import { KeyRound, Loader2 } from "lucide-react"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { ChangePasswordPayload } from "@/types"

export const MIN_PASSWORD_LENGTH = 8

/**
 * Current, new and confirm fields with the rules applied before anything
 * reaches the server. Shared by the admin and company screens.
 */
export function ChangePasswordForm({
  isPending,
  onSubmit,
}: {
  isPending: boolean
  onSubmit: (payload: ChangePasswordPayload, reset: () => void) => void
}) {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  function clear() {
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setError(null)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`The new password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.")
      return
    }
    if (newPassword === oldPassword) {
      setError("The new password must be different from the current one.")
      return
    }

    onSubmit({ old_password: oldPassword, new_password: newPassword }, clear)
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <Field
        id="old_password"
        label="Current password"
        value={oldPassword}
        onChange={setOldPassword}
        autoComplete="current-password"
      />
      <Field
        id="new_password"
        label="New password"
        value={newPassword}
        onChange={setNewPassword}
        autoComplete="new-password"
      />
      <Field
        id="confirm_password"
        label="Confirm new password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="gap-2" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        {isPending ? "Saving…" : "Change password"}
      </Button>
    </form>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <PasswordInput
        id={id}
        name={id}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </div>
  )
}
