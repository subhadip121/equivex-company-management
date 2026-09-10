import { delay } from "@/api/http"

export interface StatItem {
  key: string
  label: string
  value: string
  hint?: string
}

export interface RecentCompany {
  name: string
  isin: string
  status: "Active" | "Pending" | "Suspended"
  added: string
}

export interface ActivityItem {
  id: string
  title: string
  meta: string
  tag: string
}

export interface Deadline {
  label: string
  title: string
  daysRemaining: number
}

export function getAdminStats() {
  return delay<StatItem[]>([
    { key: "companies", label: "Total companies", value: "24", hint: "+3 this month" },
    { key: "active", label: "Active accounts", value: "21", hint: "87.5% of total" },
    { key: "documents", label: "Documents filed", value: "148", hint: "+12 this week" },
    { key: "pending", label: "Pending reviews", value: "6", hint: "2 overdue" },
  ])
}

export function getRecentCompanies() {
  return delay<RecentCompany[]>([
    { name: "Acme Industries Ltd.", isin: "INE001A01036", status: "Active", added: "12 Aug 2026" },
    {
      name: "Northwind Textiles Ltd.",
      isin: "INE002B01018",
      status: "Active",
      added: "04 Aug 2026",
    },
    {
      name: "Harbour Logistics Ltd.",
      isin: "INE003C01024",
      status: "Pending",
      added: "28 Jul 2026",
    },
  ])
}

export function getCompanyStats(_isin: string) {
  void _isin
  return delay<StatItem[]>([
    { key: "documents", label: "Documents", value: "32", hint: "4 added this month" },
    { key: "reports", label: "Reports filed", value: "9", hint: "Last on 02 Sep 2026" },
    { key: "compliance", label: "Compliance score", value: "94%", hint: "All mandatory items filed" },
    { key: "deadlines", label: "Upcoming deadlines", value: "2", hint: "Next in 6 days" },
  ])
}

export function getCompanyActivity(_isin: string) {
  void _isin
  return delay<ActivityItem[]>([
    { id: "1", title: "Quarterly report uploaded", meta: "02 Sep 2026", tag: "Report" },
    { id: "2", title: "Board resolution approved", meta: "27 Aug 2026", tag: "Compliance" },
    { id: "3", title: "Registered address updated", meta: "19 Aug 2026", tag: "Profile" },
  ])
}

export function getCompanyDeadline(_isin: string) {
  void _isin
  return delay<Deadline>({
    label: "16 Sep",
    title: "Half-yearly compliance filing",
    daysRemaining: 6,
  })
}
