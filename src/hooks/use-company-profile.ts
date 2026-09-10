import { useMutation, useQuery } from "@tanstack/react-query"
import { changeCompanyPassword, fetchCompanyProfile } from "@/api/auth"
import { queryKeys } from "@/lib/query-keys"

export function useCompanyProfile(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.companyProfile,
    queryFn: fetchCompanyProfile,
    enabled,
  })
}

export function useChangeCompanyPassword() {
  return useMutation({ mutationFn: changeCompanyPassword })
}
