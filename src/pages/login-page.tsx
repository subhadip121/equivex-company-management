import { useState } from "react"
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { AlertCircle, Building2, Loader2, ShieldCheck } from "lucide-react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { PasswordInput } from "@/components/auth/password-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { useAdminLogin, useCompanyLogin } from "@/hooks/use-login"
import { isValidIsin, normalizeIsin } from "@/lib/isin"
import type { UserRole } from "@/types"

export function LoginPage() {
  const { user } = useAuth()
  const companyLogin = useCompanyLogin()
  const adminLogin = useAdminLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // ?type=admin preselects the tab, e.g. when returning from a password reset.
  const [tab, setTab] = useState<UserRole>(
    searchParams.get("type") === "admin" ? "admin" : "company",
  )
  const [isin, setIsin] = useState("")
  const [companyPassword, setCompanyPassword] = useState("")
  const [username, setUsername] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const activeMutation = tab === "company" ? companyLogin : adminLogin
  const isSubmitting = activeMutation.isPending

  if (user) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? "/dashboard"} replace />
  }

  function handleCompanySubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!isValidIsin(isin)) {
      setError("Enter a valid 12-character ISIN number, for example INE467B01029.")
      return
    }

    companyLogin.mutate(
      { isin, password: companyPassword },
      {
        onSuccess: () => navigate("/dashboard", { replace: true }),
        onError: (mutationError) => setError(mutationError.message),
      },
    )
  }

  function handleAdminSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!username.trim() || !adminPassword) {
      setError("Enter your username and password.")
      return
    }

    adminLogin.mutate(
      { username, password: adminPassword },
      {
        onSuccess: () => navigate("/dashboard", { replace: true }),
        onError: (mutationError) => setError(mutationError.message),
      },
    )
  }

  return (
    <AuthLayout>
      <div className="mb-6 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Choose your account type to continue to the portal.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as UserRole)
          setError(null)
          companyLogin.reset()
          adminLogin.reset()
        }}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="size-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2">
            <ShieldCheck className="size-4" />
            Admin
          </TabsTrigger>
        </TabsList>

        {error ? (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <TabsContent value="company" className="mt-6">
          <form className="space-y-5" onSubmit={handleCompanySubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="isin">ISIN number</Label>
              <Input
                id="isin"
                name="isin"
                value={isin}
                onChange={(event) => setIsin(normalizeIsin(event.target.value))}
                placeholder="INE467B01029"
                autoComplete="username"
                inputMode="text"
                maxLength={12}
                className="font-mono tracking-[0.14em] uppercase"
                required
              />
              <p className="text-xs text-muted-foreground">
                12 characters, issued with your listing.
              </p>
            </div>

            <PasswordField
              id="company-password"
              accountType="company"
              value={companyPassword}
              onChange={setCompanyPassword}
            />

            <SubmitButton isSubmitting={isSubmitting} label="Sign in to company portal" />
          </form>
        </TabsContent>

        <TabsContent value="admin" className="mt-6">
          <form className="space-y-5" onSubmit={handleAdminSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>

            <PasswordField
              id="admin-password"
              accountType="admin"
              value={adminPassword}
              onChange={setAdminPassword}
            />

            <SubmitButton isSubmitting={isSubmitting} label="Sign in to admin console" />
          </form>
        </TabsContent>
      </Tabs>
    </AuthLayout>
  )
}

function PasswordField({
  id,
  accountType,
  value,
  onChange,
}: {
  id: string
  accountType: UserRole
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>Password</Label>
        <Link
          to={`/forgot-password?type=${accountType}`}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <PasswordInput
        id={id}
        name="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />
    </div>
  )
}

function SubmitButton({ isSubmitting, label }: { isSubmitting: boolean; label: string }) {
  return (
    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
      {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
      {isSubmitting ? "Signing in…" : label}
    </Button>
  )
}
