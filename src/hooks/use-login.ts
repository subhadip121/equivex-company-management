import { useMutation, useQueryClient } from "@tanstack/react-query"
import { loginAdmin, loginCompany } from "@/api/auth"
import { getAdminStats, getCompanyActivity, getCompanyDeadline, getCompanyStats, getRecentCompanies } from "@/api/dashboard"
import { queryKeys } from "@/lib/query-keys"
import { useAuth } from "@/hooks/use-auth"
import type { AuthUser, Session } from "@/types"

/**
 * Warms the cache while the user is still on the login screen, so the
 * dashboard renders with data already in hand instead of a spinner.
 */
function usePrefetchDashboard() {
  const queryClient = useQueryClient()

  return (user: AuthUser) => {
    if (user.role === "admin") {
      void queryClient.prefetchQuery({ queryKey: queryKeys.adminStats, queryFn: getAdminStats })
      void queryClient.prefetchQuery({
        queryKey: queryKeys.recentCompanies,
        queryFn: getRecentCompanies,
      })
      return
    }

    const { isin } = user
    void queryClient.prefetchQuery({
      queryKey: queryKeys.companyStats(isin),
      queryFn: () => getCompanyStats(isin),
    })
    void queryClient.prefetchQuery({
      queryKey: queryKeys.companyActivity(isin),
      queryFn: () => getCompanyActivity(isin),
    })
    void queryClient.prefetchQuery({
      queryKey: queryKeys.companyDeadline(isin),
      queryFn: () => getCompanyDeadline(isin),
    })
  }
}

export function useAdminLogin() {
  const { setSession } = useAuth()
  const prefetchDashboard = usePrefetchDashboard()

  return useMutation({
    mutationFn: loginAdmin,
    onSuccess: (session: Session) => {
      setSession(session)
      prefetchDashboard(session.user)
    },
  })
}

export function useCompanyLogin() {
  const { setSession } = useAuth()
  const prefetchDashboard = usePrefetchDashboard()

  return useMutation({
    mutationFn: loginCompany,
    onSuccess: (session: Session) => {
      setSession(session)
      prefetchDashboard(session.user)
    },
  })
}
