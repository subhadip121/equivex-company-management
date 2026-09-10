import { useState } from "react"
import { KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { useChangeCompanyPassword, useCompanyProfile } from "@/hooks/use-company-profile"
import { toStatus } from "@/lib/status"
import { QueryError } from "@/pages/shared/query-error"
import type { CompanyProfile } from "@/types"

const MIN_PASSWORD_LENGTH = 8

export function CompanyProfilePage() {
  const { user } = useAuth()
  const profile = useCompanyProfile(user?.role === "company")

  return (
    <>
      <PageHeader title="Company profile" description="Registered details for your company." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registered details</CardTitle>
            <CardDescription>Held on record against your ISIN.</CardDescription>
          </CardHeader>
          <CardContent>
            {profile.isPending ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-44 max-w-full" />
                  </div>
                ))}
              </div>
            ) : profile.isError ? (
              <QueryError onRetry={() => void profile.refetch()} />
            ) : (
              <ProfileDetails profile={profile.data} />
            )}
          </CardContent>
        </Card>

        <ChangePasswordCard />
      </div>
    </>
  )
}

function ProfileDetails({ profile }: { profile: CompanyProfile }) {
  const rows: Array<{ label: string; value?: string; mono?: boolean }> = [
    { label: "Company name", value: profile.company_name },
    { label: "ISIN", value: profile.company_isin, mono: true },
    { label: "Registration number", value: profile.registration_number, mono: true },
    { label: "Email", value: profile.email },
    { label: "Mobile", value: profile.mobile },
    { label: "Address", value: profile.address },
    // status may arrive as a boolean or a 1/0 flag, so never render it raw
    { label: "Status", value: profile.status == null ? undefined : toStatus(profile.status).label },
  ].filter((row) => Boolean(row.value))

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No details recorded yet.</p>
  }

  return (
    <dl className="divide-y">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-3">
          <dt className="text-xs text-muted-foreground sm:text-sm">{row.label}</dt>
          <dd
            className={
              row.mono
                ? "font-mono text-sm break-words sm:col-span-2"
                : "text-sm break-words sm:col-span-2"
            }
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function ChangePasswordCard() {
  const changePassword = useChangeCompanyPassword()
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

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

    changePassword.mutate(
      { old_password: oldPassword, new_password: newPassword },
      {
        onSuccess: () => {
          toast.success("Password changed")
          setOldPassword("")
          setNewPassword("")
          setConfirmPassword("")
        },
        onError: (mutationError) => setError(mutationError.message),
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Use at least {MIN_PASSWORD_LENGTH} characters.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <PasswordInput
            id="old_password"
            label="Current password"
            value={oldPassword}
            onChange={setOldPassword}
            autoComplete="current-password"
          />
          <PasswordInput
            id="new_password"
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <PasswordInput
            id="confirm_password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="gap-2" disabled={changePassword.isPending}>
            {changePassword.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            {changePassword.isPending ? "Saving…" : "Change password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function PasswordInput({
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
      <Input
        id={id}
        name={id}
        type="password"
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </div>
  )
}
