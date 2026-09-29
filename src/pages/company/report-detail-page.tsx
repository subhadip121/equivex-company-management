import { ArrowLeft, Construction } from "lucide-react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { REPORT_GROUPS, findReport } from "@/lib/company-reports"
import { ConsolidatedShareholdingPatternReport } from "@/pages/company/reports/consolidated-shareholding-pattern"

/** Reports that are built. Anything absent shows the pending notice. */
const REPORT_SCREENS: Record<string, () => React.ReactElement> = {
  "consolidated-shareholding-pattern": ConsolidatedShareholdingPatternReport,
}

export function CompanyReportDetailPage() {
  const { reportSlug } = useParams()
  const navigate = useNavigate()
  const report = findReport(reportSlug)

  // An unknown slug goes back to the hub rather than showing an empty shell.
  if (!report) return <Navigate to="/reports" replace />

  const Screen = REPORT_SCREENS[report.slug]

  return (
    <>
      <Button asChild variant="ghost" size="xs" className="mb-1 -ml-2 gap-1.5">
        <Link to="/reports">
          <ArrowLeft className="size-3.5" />
          All reports
        </Link>
      </Button>

      <PageHeader
        // The description repeats the hub card, so it is dropped here to
        // bring the data further up the page.
        className="mb-4"
        title={report.title}
        action={
          <Select value={report.slug} onValueChange={(slug) => navigate(`/reports/${slug}`)}>
            <SelectTrigger className="w-full sm:w-72" aria-label="Switch report">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_GROUPS.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.reports.map((entry) => (
                    <SelectItem key={entry.slug} value={entry.slug}>
                      {entry.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {Screen ? (
        <Screen />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Construction className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">This report is not built yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              The screen is wired up and waiting for its endpoint.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  )
}
