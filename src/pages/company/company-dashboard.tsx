import { CalendarClock, CheckCircle2, FileText, FolderClosed, RefreshCw, Upload } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { useCompanyActivity, useCompanyDeadline, useCompanyStats } from "@/hooks/use-dashboard"
import { QueryError } from "@/pages/shared/query-error"
import { StatCard, StatGridSkeleton } from "@/pages/shared/stat-card"

const STAT_ICONS: Record<string, LucideIcon> = {
  documents: FolderClosed,
  reports: FileText,
  compliance: CheckCircle2,
  deadlines: CalendarClock,
}

export function CompanyDashboard() {
  const { user } = useAuth()
  const isin = user?.role === "company" ? user.isin : ""
  const companyName = user?.role === "company" ? user.name : "your company"

  const stats = useCompanyStats(isin)
  const activity = useCompanyActivity(isin)
  const deadline = useCompanyDeadline(isin)
  const isRefreshing = stats.isFetching || activity.isFetching || deadline.isFetching

  return (
    <>
      <PageHeader
        title={`Welcome, ${companyName}`}
        description={isin ? `ISIN ${isin}` : undefined}
        action={
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh"
              onClick={() => {
                void stats.refetch()
                void activity.refetch()
                void deadline.refetch()
              }}
            >
              <RefreshCw className={isRefreshing ? "size-4 animate-spin" : "size-4"} />
            </Button>
            <Button className="gap-2">
              <Upload className="size-4" />
              Upload document
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.isPending ? (
          <StatGridSkeleton />
        ) : (
          stats.data?.map((stat) => (
            <StatCard
              key={stat.key}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
              icon={STAT_ICONS[stat.key] ?? FileText}
            />
          ))
        )}
      </div>

      {stats.isError ? (
        <div className="mt-4">
          <QueryError onRetry={() => void stats.refetch()} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Changes recorded against your company account.</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.isPending ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-52 max-w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : activity.isError ? (
              <QueryError onRetry={() => void activity.refetch()} />
            ) : (
              <div className="divide-y">
                {activity.data?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.meta}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {item.tag}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next deadline</CardTitle>
            <CardDescription>
              {deadline.data?.title ?? "Upcoming compliance filing"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {deadline.isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <div>
                <p className="text-3xl font-semibold tracking-tight">
                  {deadline.data?.label ?? "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {deadline.data ? `${deadline.data.daysRemaining} days remaining` : ""}
                </p>
              </div>
            )}
            <Button variant="outline" className="w-full">
              Start filing
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
