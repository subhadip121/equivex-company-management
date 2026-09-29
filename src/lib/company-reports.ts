import {
  ArrowLeftRight,
  BarChart3,
  Coins,
  Crown,
  FileBarChart,
  Handshake,
  Lock,
  PieChart,
  Percent,
  Search,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface CompanyReport {
  /** URL segment under /reports. */
  slug: string
  title: string
  description: string
  icon: LucideIcon
}

export interface ReportGroup {
  label: string
  reports: CompanyReport[]
}

/**
 * Every report the company portal offers. The hub, the switcher and the
 * routes all read from here, so a new report is a single entry.
 */
export const REPORT_GROUPS: ReportGroup[] = [
  {
    label: "Shareholding",
    reports: [
      {
        slug: "share-holding",
        title: "Share Holding",
        description: "Current holdings across all shareholders.",
        icon: PieChart,
      },
      {
        slug: "summary-of-shareholding",
        title: "Summary of Shareholding",
        description: "Headline totals for the current position.",
        icon: FileBarChart,
      },
      {
        slug: "consolidated-shareholding-pattern",
        title: "Consolidated Shareholding Pattern",
        description: "Pattern of holding by shareholder category.",
        icon: BarChart3,
      },
      {
        slug: "consolidated-change-in-shareholding-pattern",
        title: "Consolidated Change in Shareholding Pattern",
        description: "Movement in the pattern between two dates.",
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    label: "Shareholders",
    reports: [
      {
        slug: "search",
        title: "Search",
        description: "Find a shareholder by folio, name or ISIN.",
        icon: Search,
      },
      {
        slug: "top-shareholders",
        title: "Top Shareholders",
        description: "Largest holders ranked by shares held.",
        icon: Crown,
      },
      {
        slug: "shareholders-above-one-percent",
        title: "List of Shareholders holding 1% and above Shares",
        description: "Holders at or above the one percent threshold.",
        icon: Percent,
      },
      {
        slug: "top-100-comparison-two-weeks",
        title: "Top 100 Shareholder comparison for 2 weeks",
        description: "Week on week movement across the top 100.",
        icon: Users,
      },
    ],
  },
  {
    label: "Distribution",
    reports: [
      {
        slug: "distribution-by-share-holding",
        title: "Distribution Schedule by Share Holding",
        description: "Shareholders banded by number of shares.",
        icon: BarChart3,
      },
      {
        slug: "distribution-by-notional-value",
        title: "Distribution Schedule by Notional Value",
        description: "Shareholders banded by value of holding.",
        icon: Coins,
      },
    ],
  },
  {
    label: "Restrictions",
    reports: [
      {
        slug: "lock-in-shares-summary",
        title: "Lock-in Shares Summary",
        description: "Shares under a lock-in restriction.",
        icon: Lock,
      },
      {
        slug: "pledge-shares-summary",
        title: "Pledge Shares Summary",
        description: "Shares pledged against borrowing.",
        icon: Handshake,
      },
    ],
  },
]

export const ALL_REPORTS: CompanyReport[] = REPORT_GROUPS.flatMap((group) => group.reports)

export function findReport(slug: string | undefined) {
  return ALL_REPORTS.find((report) => report.slug === slug)
}
