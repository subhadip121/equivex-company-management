import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card } from "@/components/ui/card"
import { REPORT_GROUPS, type CompanyReport } from "@/lib/company-reports"

export function CompanyReportsHubPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Shareholding reports for your company. Choose a report to open it."
      />

      <div className="space-y-8">
        {REPORT_GROUPS.map((group) => (
          <section key={group.label} aria-labelledby={`group-${group.label}`}>
            <h2
              id={`group-${group.label}`}
              className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {group.label}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.reports.map((report) => (
                <ReportCard key={report.slug} report={report} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}

function ReportCard({ report }: { report: CompanyReport }) {
  return (
    <Card className="group p-0 transition-colors hover:border-primary/40 hover:bg-accent/40">
      {/* The whole card is the target, so there is no small link to aim at. */}
      <Link
        to={`/reports/${report.slug}`}
        className="flex h-full items-center gap-3 p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="rounded-lg bg-accent p-2 text-accent-foreground">
          <report.icon className="size-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-balance">{report.title}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{report.description}</span>
        </span>

        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Card>
  )
}
