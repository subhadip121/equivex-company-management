import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { AlertCircle, Building2, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { useAdminLogin, useCompanyLogin } from "@/hooks/use-login"
import { isValidIsin, normalizeIsin } from "@/lib/isin"
import { cn } from "@/lib/utils"

type LoginTab = "company" | "admin"

const HIGHLIGHTS = [
  "Company records, filings and documents in one place",
  "ISIN-based access for every listed company",
  "Administrator controls for onboarding and oversight",
]

export function LoginPage() {
  const { user } = useAuth()
  const companyLogin = useCompanyLogin()
  const adminLogin = useAdminLogin()
  const navigate = useNavigate()
  const location = useLocation()

  const [tab, setTab] = useState<LoginTab>("company")
  const [isin, setIsin] = useState("")
  const [companyPassword, setCompanyPassword] = useState("")
  const [username, setUsername] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />

      <div className="relative flex flex-col">
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Logo className="h-10" />
            </div>

            <div className="mb-6 space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sign in</h1>
              <p className="text-sm text-muted-foreground">
                Choose your account type to continue to the portal.
              </p>
            </div>

            <Tabs
              value={tab}
              onValueChange={(value) => {
                setTab(value as LoginTab)
                setError(null)
                setShowPassword(false)
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
                    value={companyPassword}
                    onChange={setCompanyPassword}
                    show={showPassword}
                    onToggle={() => setShowPassword((value) => !value)}
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
                    value={adminPassword}
                    onChange={setAdminPassword}
                    show={showPassword}
                    onToggle={() => setShowPassword((value) => !value)}
                  />

                  <SubmitButton isSubmitting={isSubmitting} label="Sign in to admin console" />
                </form>
              </TabsContent>
            </Tabs>

          </div>
        </div>

        <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground sm:px-8">
          &copy; {new Date().getFullYear()} Equivex. All rights reserved.
        </footer>
      </div>
    </div>
  )
}

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-brand-dark text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            "radial-gradient(70rem 40rem at 110% -10%, #0061b2 0%, transparent 55%), radial-gradient(50rem 40rem at -20% 120%, #5e9b23 0%, transparent 60%)",
        }}
      />

      <div className="relative">
        <div className="inline-flex rounded-xl bg-white/95 px-5 py-3 shadow-lg">
          <Logo className="h-9 dark:invert-0 dark:hue-rotate-0" />
        </div>
      </div>

      <div className="relative max-w-lg space-y-6">
        <h2 className="text-4xl font-semibold leading-tight tracking-tight">
          Company management, end to end.
        </h2>
        <ul className="space-y-3">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-white/80">
              <span
                aria-hidden="true"
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent-green-light"
              />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-white/50">
        Secure access for administrators and listed companies.
      </p>
    </div>
  )
}

function PasswordField({
  id,
  value,
  onChange,
  show,
  onToggle,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggle: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>Password</Label>
        <button
          type="button"
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Forgot password?
        </button>
      </div>
      <div className="relative">
        <Input
          id={id}
          name="password"
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          className="pr-10"
          required
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className={cn(
            "absolute inset-y-0 right-0 flex w-10 items-center justify-center",
            "text-muted-foreground transition-colors hover:text-foreground",
          )}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
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
