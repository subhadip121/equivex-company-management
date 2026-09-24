import { toast } from "sonner"
import { ChangePasswordForm, MIN_PASSWORD_LENGTH } from "@/components/auth/change-password-form"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { useChangeCompanyPassword, useCompanyProfile } from "@/hooks/use-company-profile"
import { toStatus } from "@/lib/status"
import { QueryError } from "@/pages/shared/query-error"
import type { CompanyProfile } from "@/types"

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Use at least {MIN_PASSWORD_LENGTH} characters.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChangePasswordForm
          isPending={changePassword.isPending}
          onSubmit={(payload, reset) =>
            changePassword.mutate(payload, {
              onSuccess: () => {
                toast.success("Password changed")
                reset()
              },
              onError: (error) => toast.error(error.message),
            })
          }
        />
      </CardContent>
    </Card>
  )
}
