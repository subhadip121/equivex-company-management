import { Building2, FileText, RefreshCw, TrendingUp, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { CreateCompanyDialog } from "@/components/company/create-company-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminStats, useRecentCompanies } from "@/hooks/use-dashboard"
import { QueryError } from "@/pages/shared/query-error"
import { StatCard, StatGridSkeleton } from "@/pages/shared/stat-card"

const STAT_ICONS: Record<string, LucideIcon> = {
  companies: Building2,
  active: Users,
  documents: FileText,
  pending: TrendingUp,
}

export function AdminDashboard() {
  const stats = useAdminStats()
  const companies = useRecentCompanies()
  const isRefreshing = stats.isFetching || companies.isFetching

  return (
    <>
      <PageHeader
        title="Admin overview"
        description="Monitor company accounts and activity across the platform."
        action={
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh"
              onClick={() => {
                void stats.refetch()
                void companies.refetch()
              }}
            >
              <RefreshCw className={isRefreshing ? "size-4 animate-spin" : "size-4"} />
            </Button>
            <CreateCompanyDialog />
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
              icon={STAT_ICONS[stat.key] ?? TrendingUp}
            />
          ))
        )}
      </div>

      {stats.isError ? (
        <div className="mt-4">
          <QueryError onRetry={() => void stats.refetch()} />
        </div>
      ) : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recently added companies</CardTitle>
          <CardDescription>The latest company accounts created on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {companies.isPending ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48 max-w-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : companies.isError ? (
            <QueryError onRetry={() => void companies.refetch()} />
          ) : (
            <div className="divide-y">
              {companies.data?.map((company) => (
                <div
                  key={company.isin}
                  className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{company.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {company.isin}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={company.status === "Active" ? "secondary" : "outline"}>
                      {company.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{company.added}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
