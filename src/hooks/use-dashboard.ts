import { useQuery } from "@tanstack/react-query"
import {
  getAdminStats,
  getCompanyActivity,
  getCompanyDeadline,
  getCompanyStats,
  getRecentCompanies,
} from "@/api/dashboard"
import { queryKeys } from "@/lib/query-keys"

export function useAdminStats() {
  return useQuery({ queryKey: queryKeys.adminStats, queryFn: getAdminStats })
}

export function useRecentCompanies() {
  return useQuery({ queryKey: queryKeys.recentCompanies, queryFn: getRecentCompanies })
}

export function useCompanyStats(isin: string) {
  return useQuery({
    queryKey: queryKeys.companyStats(isin),
    queryFn: () => getCompanyStats(isin),
    enabled: Boolean(isin),
  })
}

export function useCompanyActivity(isin: string) {
  return useQuery({
    queryKey: queryKeys.companyActivity(isin),
    queryFn: () => getCompanyActivity(isin),
    enabled: Boolean(isin),
  })
}

export function useCompanyDeadline(isin: string) {
  return useQuery({
    queryKey: queryKeys.companyDeadline(isin),
    queryFn: () => getCompanyDeadline(isin),
    enabled: Boolean(isin),
  })
}
