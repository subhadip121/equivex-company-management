import { AdminDashboard } from "@/pages/admin/admin-dashboard"
import { CompanyDashboard } from "@/pages/company/company-dashboard"
import { useAuth } from "@/hooks/use-auth"

export function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null
  return user.role === "admin" ? <AdminDashboard /> : <CompanyDashboard />
}
