import { useState } from "react"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { useAdminProfile, useUpdateAdminProfile } from "@/hooks/use-admin-profile"
import { QueryError } from "@/pages/shared/query-error"
import type { AdminProfile } from "@/types"

export function AdminProfilePage() {
  const { user } = useAuth()
  const profile = useAdminProfile(user?.role === "admin")

  return (
    <>
      <PageHeader title="My profile" description="Your administrator account details." />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>These details appear across the admin console.</CardDescription>
        </CardHeader>
        <CardContent>
          {profile.isPending ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : profile.isError ? (
            <QueryError onRetry={() => void profile.refetch()} />
          ) : (
            <ProfileForm key={profile.data.id} initial={profile.data} />
          )}
        </CardContent>
      </Card>
    </>
  )
}

function ProfileForm({ initial }: { initial: AdminProfile }) {
  const updateProfile = useUpdateAdminProfile()
  const [form, setForm] = useState<AdminProfile>(initial)

  function setField(field: keyof AdminProfile, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    updateProfile.mutate(form, {
      onSuccess: () => toast.success("Profile updated"),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
      <Field
        id="first_name"
        label="First name"
        value={form.first_name}
        onChange={(value) => setField("first_name", value)}
        required
      />
      <Field
        id="middle_name"
        label="Middle name"
        value={form.middle_name}
        onChange={(value) => setField("middle_name", value)}
      />
      <Field
        id="last_name"
        label="Last name"
        value={form.last_name}
        onChange={(value) => setField("last_name", value)}
      />
      <Field
        id="mobile"
        label="Mobile"
        type="tel"
        inputMode="tel"
        value={form.mobile}
        onChange={(value) => setField("mobile", value)}
      />
      <div className="sm:col-span-2">
        <Field
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) => setField("email", value)}
          required
        />
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" className="gap-2" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {updateProfile.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  required,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  inputMode?: "text" | "tel" | "email"
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </div>
  )
}
