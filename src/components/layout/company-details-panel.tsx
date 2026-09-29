import { Building2, Clock, Mail } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useCompanyProfile } from "@/hooks/use-company-profile"
import { formatDateTime, formatNumber, toNumber } from "@/lib/format"
import type { CompanyProfile } from "@/types"

/** First value present wins, so varied field spellings all resolve. */
function pick(...values: Array<string | number | null | undefined>) {
  return values.find((value) => value !== null && value !== undefined && value !== "")
}

function readProfile(profile: CompanyProfile) {
  const shareCapital = toNumber(
    pick(profile.share_capital, profile.shareCapital, profile.total_share_capital),
  )
  const faceValue = toNumber(pick(profile.face_value, profile.faceValue))

  return {
    name: profile.company_name,
    isin: profile.company_isin,
    email: profile.email,
    shareCapital: shareCapital === null ? null : formatNumber(shareCapital),
    faceValue: faceValue === null ? null : formatNumber(faceValue),
    lastLogin: formatDateTime(
      pick(profile.last_login, profile.lastLogin, profile.last_login_time, profile.last_login_date),
    ),
  }
}

/**
 * Company details above the sign-out button. Hidden when the sidebar is
 * collapsed to icons, where there is no room for labels and values.
 */
export function CompanyDetailsPanel() {
  const profile = useCompanyProfile(true)

  if (profile.isError) return null

  return (
    <div className="px-1 pb-1 group-data-[collapsible=icon]:hidden">
      <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
        {profile.isPending ? <PanelSkeleton /> : profile.data ? <Panel profile={profile.data} /> : null}
      </div>
    </div>
  )
}

function Panel({ profile }: { profile: CompanyProfile }) {
  const details = readProfile(profile)

  return (
    <div className="space-y-2.5">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 rounded-md bg-sidebar-primary/15 p-1.5 text-sidebar-primary">
          <Building2 className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm leading-tight font-semibold text-sidebar-foreground"
            title={details.name}
          >
            {details.name ?? "Company"}
          </p>
          {details.isin ? (
            <p className="truncate font-mono text-[10px] tracking-wide text-sidebar-foreground/60">
              {details.isin}
            </p>
          ) : null}
        </div>
      </div>

      {details.email ? (
        <div className="flex items-center gap-1.5 text-[11px] text-sidebar-foreground/70">
          <Mail className="size-3 shrink-0" />
          <span className="truncate" title={details.email}>
            {details.email}
          </span>
        </div>
      ) : null}

      {details.shareCapital || details.faceValue ? (
        <div className="grid grid-cols-2 gap-1.5">
          <Stat label="Shares" value={details.shareCapital} />
          <Stat label="Face value" value={details.faceValue} />
        </div>
      ) : null}

      {details.lastLogin ? (
        <div className="flex items-center gap-1.5 border-t border-sidebar-border/70 pt-2 text-[10px] text-sidebar-foreground/50">
          <Clock className="size-3 shrink-0" />
          <span className="truncate">Last login {details.lastLogin}</span>
        </div>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | null }) {
  if (!value) return null

  return (
    <div className="rounded-md bg-sidebar/60 px-2 py-1.5">
      <p className="text-[9px] tracking-wide text-sidebar-foreground/50 uppercase">{label}</p>
      <p className="truncate text-xs font-medium text-sidebar-foreground tabular-nums" title={value}>
        {value}
      </p>
    </div>
  )
}

function PanelSkeleton() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-start gap-2">
        <Skeleton className="size-6 rounded-md bg-sidebar-foreground/10" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3.5 w-28 bg-sidebar-foreground/10" />
          <Skeleton className="h-2.5 w-20 bg-sidebar-foreground/10" />
        </div>
      </div>
      <Skeleton className="h-3 w-32 bg-sidebar-foreground/10" />
      <div className="grid grid-cols-2 gap-1.5">
        <Skeleton className="h-9 bg-sidebar-foreground/10" />
        <Skeleton className="h-9 bg-sidebar-foreground/10" />
      </div>
    </div>
  )
}
