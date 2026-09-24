import { toast } from "sonner"
import { ChangePasswordForm, MIN_PASSWORD_LENGTH } from "@/components/auth/change-password-form"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useChangeAdminPassword } from "@/hooks/use-admin-profile"

export function AdminChangePasswordPage() {
  const changePassword = useChangeAdminPassword()

  return (
    <>
      <PageHeader title="Update password" description="Change the password you sign in with." />

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
    </>
  )
}
