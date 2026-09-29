import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { useCompanyProfile } from "@/hooks/use-company-profile"
import { formatDateTime, humaniseKey } from "@/lib/format"
import { toStatus } from "@/lib/status"
import { QueryError } from "@/pages/shared/query-error"
import type { CompanyProfile } from "@/types"

export function CompanyProfilePage() {
  const { user } = useAuth()
  const profile = useCompanyProfile(user?.role === "company")

  return (
    <>
      <PageHeader title="Company profile" description="Registered details for your company." />

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
    </>
  )
}

/** Identifier leads the list. */
const FIRST_KEYS = ["id"]

/** Record-keeping timestamps close it out. */
const LAST_KEYS = [
  "created_at",
  "createdAt",
  "created_on",
  "created_date",
  "updated_at",
  "updatedAt",
  "updated_on",
  "modified_at",
]

/** Shown after the id and with friendlier names; the rest follows as sent. */
const PREFERRED_ORDER = [
  "company_name",
  "company_isin",
  "company_cin",
  "company_code",
  "registration_number",
  "email",
  "mobile",
  "phone_no",
  "fax",
  "website",
  "address",
]

const LABEL_OVERRIDES: Record<string, string> = {
  company_isin: "ISIN",
  company_cin: "CIN",
  phone_no: "Phone",
  email: "Email",
}

/** Values that read better in monospace. */
const MONO_KEYS = new Set(["company_isin", "company_cin", "company_code", "registration_number"])

const ISO_DATE = /^\d{4}-\d{2}-\d{2}([T ]|$)/

/** Status-like keys, whatever the backend calls them. */
function isStatusKey(key: string) {
  const normalised = key.toLowerCase()
  return normalised === "status" || normalised === "is_active" || normalised === "active"
}

function formatValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "—"
  // Checked before the boolean case, which would otherwise render Yes/No.
  // Always the plain two states, whether the API sends 1/0, a boolean or a word.
  if (isStatusKey(key)) return toStatus(value).isActive ? "Active" : "Inactive"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "string" && ISO_DATE.test(value)) return formatDateTime(value) ?? value
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function orderKeys(keys: string[]) {
  const first = FIRST_KEYS.filter((key) => keys.includes(key))
  const preferred = PREFERRED_ORDER.filter((key) => keys.includes(key))
  const last = LAST_KEYS.filter((key) => keys.includes(key))

  const placed = new Set([...first, ...preferred, ...last])
  const rest = keys.filter((key) => !placed.has(key)).sort()

  return [...first, ...preferred, ...rest, ...last]
}

function ProfileDetails({ profile }: { profile: CompanyProfile }) {
  // Everything the endpoint returns is shown, including fields added later.
  const record = profile as unknown as Record<string, unknown>
  const keys = orderKeys(Object.keys(record))

  if (keys.length === 0) {
    return <p className="text-sm text-muted-foreground">No details recorded yet.</p>
  }

  return (
    <dl className="divide-y">
      {keys.map((key) => (
        <div key={key} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-3">
          <dt className="text-xs text-muted-foreground sm:text-sm">
            {LABEL_OVERRIDES[key] ?? humaniseKey(key)}
          </dt>
          <dd
            className={
              MONO_KEYS.has(key)
                ? "font-mono text-sm break-words sm:col-span-2"
                : "text-sm break-words sm:col-span-2"
            }
          >
            {formatValue(key, record[key])}
          </dd>
        </div>
      ))}
    </dl>
  )
}

