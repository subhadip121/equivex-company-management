import { Building2, FileText, LayoutDashboard, KeyRound, UserRound } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { UserRole } from "@/types"

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

const ADMIN_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Manage",
    items: [
      { title: "Companies", url: "/companies", icon: Building2 },
      { title: "Upload report", url: "/reports", icon: FileText },
    ],
  },
  {
    label: "System",
    items: [
      { title: "My profile", url: "/profile", icon: UserRound },
      { title: "Update password", url: "/change-password", icon: KeyRound },
    ],
  },
]

const COMPANY_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Company",
    items: [
      { title: "Company profile", url: "/profile", icon: Building2 },
      { title: "Reports", url: "/reports", icon: FileText },
    ],
  },
  {
    label: "System",
    items: [{ title: "Update password", url: "/change-password", icon: KeyRound }],
  },
]

export function getNavigation(role: UserRole): NavGroup[] {
  return role === "admin" ? ADMIN_NAV : COMPANY_NAV
}
