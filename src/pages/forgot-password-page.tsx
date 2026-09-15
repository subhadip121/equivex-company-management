import { useEffect, useState } from "react"
import { Link, Navigate, useSearchParams } from "react-router-dom"
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { PasswordInput } from "@/components/auth/password-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import {
  useRequestPasswordReset,
  useResetPassword,
  useVerifyResetCode,
} from "@/hooks/use-password-reset"
import { isValidIsin, normalizeIsin } from "@/lib/isin"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types"

type Step = "request" | "verify" | "reset" | "done"

const CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 30
const MIN_PASSWORD_LENGTH = 8

const STEP_ORDER: Step[] = ["request", "verify", "reset"]

export function ForgotPasswordPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState<Step>("request")
  const [accountType, setAccountType] = useState<UserRole>(
    searchParams.get("type") === "admin" ? "admin" : "company",
  )
  const [identifier, setIdentifier] = useState("")
  const [resetToken, setResetToken] = useState("")

  if (user) return <Navigate to="/dashboard" replace />

  return (
    <AuthLayout>
      {step !== "done" ? <StepIndicator current={step} /> : null}

      {step === "request" ? (
        <RequestStep
          accountType={accountType}
          onAccountTypeChange={(type) => {
            setAccountType(type)
            setIdentifier("")
          }}
          identifier={identifier}
          onIdentifierChange={setIdentifier}
          onSent={() => setStep("verify")}
        />
      ) : null}

      {step === "verify" ? (
        <VerifyStep
          accountType={accountType}
          identifier={identifier}
          onVerified={(token) => {
            setResetToken(token)
            setStep("reset")
          }}
          onChangeAccount={() => setStep("request")}
        />
      ) : null}

      {step === "reset" ? (
        <ResetStep
          accountType={accountType}
          identifier={identifier}
          resetToken={resetToken}
          onDone={() => setStep("done")}
        />
      ) : null}

      {step === "done" ? <DoneStep accountType={accountType} /> : null}

      {step !== "done" ? (
        <div className="mt-8 text-center">
          <Link
            to={`/login?type=${accountType}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
        </div>
      ) : null}
    </AuthLayout>
  )
}

function StepIndicator({ current }: { current: Step }) {
  const index = STEP_ORDER.indexOf(current)

  return (
    <div className="mb-6 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Step {index + 1} of {STEP_ORDER.length}
      </p>
      <div className="flex gap-1.5" aria-hidden="true">
        {STEP_ORDER.map((step, position) => (
          <span
            key={step}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              position <= index ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  )
}

function StepHeading({ title, description }: { title: string; description: React.ReactNode }) {
  return (
    <div className="mb-6 space-y-1.5">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function ErrorAlert({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

function RequestStep({
  accountType,
  onAccountTypeChange,
  identifier,
  onIdentifierChange,
  onSent,
}: {
  accountType: UserRole
  onAccountTypeChange: (type: UserRole) => void
  identifier: string
  onIdentifierChange: (value: string) => void
  onSent: () => void
}) {
  const requestReset = useRequestPasswordReset()
  const [error, setError] = useState<string | null>(null)
  const isCompany = accountType === "company"

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (isCompany && !isValidIsin(identifier)) {
      setError("Enter a valid 12-character ISIN number, for example INE467B01029.")
      return
    }
    if (!isCompany && !identifier.trim()) {
      setError("Enter your username.")
      return
    }

    requestReset.mutate(
      { accountType, identifier: identifier.trim() },
      { onSuccess: onSent, onError: (mutationError) => setError(mutationError.message) },
    )
  }

  return (
    <>
      <StepHeading
        title="Forgot password"
        description="We'll send a verification code to the email address registered with your account."
      />

      <Tabs
        value={accountType}
        onValueChange={(value) => {
          onAccountTypeChange(value as UserRole)
          setError(null)
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
      </Tabs>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
        <ErrorAlert message={error} />

        <div className="space-y-2">
          <Label htmlFor="identifier">{isCompany ? "ISIN number" : "Username"}</Label>
          {isCompany ? (
            <Input
              id="identifier"
              name="isin"
              value={identifier}
              onChange={(event) => onIdentifierChange(normalizeIsin(event.target.value))}
              placeholder="INE467B01029"
              autoComplete="username"
              maxLength={12}
              className="font-mono tracking-[0.14em] uppercase"
              autoFocus
            />
          ) : (
            <Input
              id="identifier"
              name="username"
              value={identifier}
              onChange={(event) => onIdentifierChange(event.target.value)}
              placeholder="Username"
              autoComplete="username"
              autoFocus
            />
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={requestReset.isPending}>
          {requestReset.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {requestReset.isPending ? "Sending code…" : "Send verification code"}
        </Button>
      </form>
    </>
  )
}

function VerifyStep({
  accountType,
  identifier,
  onVerified,
  onChangeAccount,
}: {
  accountType: UserRole
  identifier: string
  onVerified: (resetToken: string) => void
  onChangeAccount: () => void
}) {
  const verifyCode = useVerifyResetCode()
  const resendCode = useRequestPasswordReset()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  function submit(value: string) {
    setError(null)
    setNotice(null)

    if (value.length !== CODE_LENGTH) {
      setError(`Enter the ${CODE_LENGTH}-digit code from the email.`)
      return
    }

    verifyCode.mutate(
      { accountType, identifier, code: value },
      {
        onSuccess: ({ resetToken }) => onVerified(resetToken),
        onError: (mutationError) => {
          setError(mutationError.message)
          setCode("")
        },
      },
    )
  }

  function handleResend() {
    setError(null)
    setNotice(null)
    resendCode.mutate(
      { accountType, identifier },
      {
        onSuccess: () => {
          setNotice("A new code is on its way.")
          setCooldown(RESEND_COOLDOWN_SECONDS)
          setCode("")
        },
        onError: (mutationError) => setError(mutationError.message),
      },
    )
  }

  return (
    <>
      <StepHeading
        title="Check your email"
        description={
          <>
            Enter the {CODE_LENGTH}-digit code sent to the email registered for{" "}
            <span
              className={cn(
                "font-medium text-foreground",
                accountType === "company" && "font-mono",
              )}
            >
              {identifier}
            </span>
            .
          </>
        }
      />

      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          submit(code)
        }}
        noValidate
      >
        <ErrorAlert message={error} />
        {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}

        <div className="space-y-2">
          <Label htmlFor="reset-code">Verification code</Label>
          <InputOTP
            id="reset-code"
            maxLength={CODE_LENGTH}
            value={code}
            onChange={(value) => setCode(value.replace(/\D/g, ""))}
            // Submits as soon as the last digit lands, pasted or typed.
            onComplete={submit}
            inputMode="numeric"
            pattern="^[0-9]*$"
            autoComplete="one-time-code"
            disabled={verifyCode.isPending}
            autoFocus
            containerClassName="justify-center sm:justify-start"
          >
            <InputOTPGroup>
              {Array.from({ length: CODE_LENGTH }, (_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  aria-invalid={Boolean(error) || undefined}
                  className="size-11 text-base sm:size-12"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={verifyCode.isPending}>
          {verifyCode.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {verifyCode.isPending ? "Verifying…" : "Verify code"}
        </Button>

        <div className="flex flex-col items-center justify-between gap-2 text-sm sm:flex-row">
          <button
            type="button"
            onClick={onChangeAccount}
            className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Use a different account
          </button>

          {cooldown > 0 ? (
            <span className="text-muted-foreground" aria-live="polite">
              Resend code in {cooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCode.isPending}
              className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
            >
              {resendCode.isPending ? "Sending…" : "Resend code"}
            </button>
          )}
        </div>
      </form>
    </>
  )
}

function ResetStep({
  accountType,
  identifier,
  resetToken,
  onDone,
}: {
  accountType: UserRole
  identifier: string
  resetToken: string
  onDone: () => void
}) {
  const resetPassword = useResetPassword()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const rules = [
    {
      label: `At least ${MIN_PASSWORD_LENGTH} characters`,
      met: newPassword.length >= MIN_PASSWORD_LENGTH,
    },
    { label: "Passwords match", met: newPassword.length > 0 && newPassword === confirmPassword },
  ]

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

    resetPassword.mutate(
      { accountType, identifier, resetToken, newPassword },
      { onSuccess: onDone, onError: (mutationError) => setError(mutationError.message) },
    )
  }

  return (
    <>
      <StepHeading
        title="Set a new password"
        description="Choose a password you have not used for this account before."
      />

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <ErrorAlert message={error} />

        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <PasswordInput
            id="new-password"
            name="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <PasswordInput
            id="confirm-password"
            name="confirm-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
        </div>

        <ul className="space-y-1.5" aria-label="Password requirements">
          {rules.map((rule) => (
            <li
              key={rule.label}
              className={cn(
                "flex items-center gap-2 text-sm transition-colors",
                rule.met ? "text-accent-green" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-full border",
                  rule.met ? "border-accent-green bg-accent-green text-white" : "border-border",
                )}
              >
                {rule.met ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>
              {rule.label}
              <span className="sr-only">{rule.met ? "(met)" : "(not met)"}</span>
            </li>
          ))}
        </ul>

        <Button type="submit" size="lg" className="w-full" disabled={resetPassword.isPending}>
          {resetPassword.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {resetPassword.isPending ? "Updating password…" : "Update password"}
        </Button>
      </form>
    </>
  )
}

function DoneStep({ accountType }: { accountType: UserRole }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-accent-green/15">
        <CheckCircle2 className="size-8 text-accent-green" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Password updated</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Your password has been changed. Sign in with your new password to continue.
      </p>
      <Button asChild size="lg" className="mt-8 w-full">
        <Link to={`/login?type=${accountType}`}>Back to sign in</Link>
      </Button>
    </div>
  )
}
