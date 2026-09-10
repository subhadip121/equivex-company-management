import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { isValidIsin, normalizeIsin } from "@/lib/isin"
import {
  normalizeCin,
  normalizeDigits,
  required,
  validateCin,
  validateEmail,
  validatePhone,
  validateWebsite,
} from "@/lib/validation"
import type { CreateCompanyPayload } from "@/types"

const EMPTY_COMPANY: CreateCompanyPayload = {
  company_name: "",
  company_isin: "",
  company_cin: "",
  company_code: "",
  email: "",
  phone_no: "",
  fax: "",
  website: "",
  address: "",
}

type Errors = Partial<Record<keyof CreateCompanyPayload, string>>

function validate(form: CreateCompanyPayload, withCode: boolean): Errors {
  const errors: Errors = {}

  const name = required(form.company_name, "Company name")
  if (name) errors.company_name = name

  if (!form.company_isin.trim()) {
    errors.company_isin = "ISIN is required."
  } else if (!isValidIsin(form.company_isin)) {
    errors.company_isin = "Enter a valid 12-character ISIN, for example INE467B01029."
  }

  const cin = validateCin(form.company_cin)
  if (cin) errors.company_cin = cin

  if (withCode) {
    const code = required(form.company_code, "Company code")
    if (code) errors.company_code = code
  }

  const email = validateEmail(form.email)
  if (email) errors.email = email

  const phone = validatePhone(form.phone_no)
  if (phone) errors.phone_no = phone

  const website = validateWebsite(form.website)
  if (website) errors.website = website

  const address = required(form.address, "Address")
  if (address) errors.address = address

  return errors
}

/**
 * Shared by create and edit. The company code is set once at creation and
 * is not part of the update payload, so it only appears in create mode.
 */
export function CompanyForm({
  mode,
  initial,
  isPending,
  submitLabel,
  pendingLabel,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit"
  initial?: CreateCompanyPayload
  isPending: boolean
  submitLabel: string
  pendingLabel: string
  onSubmit: (values: CreateCompanyPayload) => void
  onCancel: () => void
}) {
  const withCode = mode === "create"
  const [form, setForm] = useState<CreateCompanyPayload>(initial ?? EMPTY_COMPANY)
  const [errors, setErrors] = useState<Errors>({})

  function setField(field: keyof CreateCompanyPayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const found = validate(form, withCode)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }

    onSubmit({ ...form, company_isin: normalizeIsin(form.company_isin) })
  }

  return (
    <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
      <div className="sm:col-span-2">
        <Field
          id="company_name"
          label="Company name"
          value={form.company_name}
          onChange={(value) => setField("company_name", value)}
          error={errors.company_name}
        />
      </div>

      <Field
        id="company_isin"
        label="ISIN"
        value={form.company_isin}
        onChange={(value) => setField("company_isin", normalizeIsin(value))}
        error={errors.company_isin}
        className="font-mono uppercase"
        maxLength={12}
      />

      {withCode ? (
        <Field
          id="company_code"
          label="Company code"
          value={form.company_code}
          onChange={(value) => setField("company_code", value)}
          error={errors.company_code}
        />
      ) : null}

      {/* With no code field to sit beside it, CIN pairs with ISIN instead. */}
      <div className={withCode ? "sm:col-span-2" : undefined}>
        <Field
          id="company_cin"
          label="CIN"
          value={form.company_cin}
          onChange={(value) => setField("company_cin", normalizeCin(value))}
          error={errors.company_cin}
          className="font-mono uppercase"
          maxLength={21}
        />
      </div>

      <Field
        id="email"
        label="Email"
        type="email"
        value={form.email}
        onChange={(value) => setField("email", value)}
        error={errors.email}
      />

      <Field
        id="phone_no"
        label="Phone number"
        type="tel"
        value={form.phone_no}
        onChange={(value) => setField("phone_no", normalizeDigits(value, 10))}
        error={errors.phone_no}
        maxLength={10}
      />

      <Field
        id="fax"
        label="Fax"
        optional
        value={form.fax}
        onChange={(value) => setField("fax", value)}
        error={errors.fax}
      />

      <Field
        id="website"
        label="Website"
        optional
        value={form.website}
        onChange={(value) => setField("website", value)}
        error={errors.website}
      />

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          name="address"
          rows={3}
          value={form.address}
          onChange={(event) => setField("address", event.target.value)}
          placeholder="Address"
          aria-invalid={Boolean(errors.address)}
        />
        {errors.address ? <p className="text-sm text-destructive">{errors.address}</p> : null}
      </div>

      <DialogFooter className="sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="gap-2" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {isPending ? pendingLabel : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  className,
  maxLength,
  optional,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: string
  className?: string
  maxLength?: number
  optional?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {optional ? <span className="ml-1 text-xs text-muted-foreground">(optional)</span> : null}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        className={className}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
