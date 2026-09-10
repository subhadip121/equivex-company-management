import {
  Building2,
  FileText,
  FolderClosed,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react"
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
      { title: "Users", url: "/users", icon: Users },
      { title: "Documents", url: "/documents", icon: FolderClosed },
      { title: "Reports", url: "/reports", icon: FileText },
    ],
  },
  {
    label: "System",
    items: [
      { title: "My profile", url: "/profile", icon: UserRound },
      { title: "Settings", url: "/settings", icon: Settings },
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
      { title: "Documents", url: "/documents", icon: FolderClosed },
      { title: "Reports", url: "/reports", icon: FileText },
      { title: "Compliance", url: "/compliance", icon: ShieldCheck },
    ],
  },
  {
    label: "System",
    items: [{ title: "Settings", url: "/settings", icon: Settings }],
  },
]

export function getNavigation(role: UserRole): NavGroup[] {
  return role === "admin" ? ADMIN_NAV : COMPANY_NAV
}
