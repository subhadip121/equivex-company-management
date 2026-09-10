import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchAdminProfile, updateAdminProfile } from "@/api/auth"
import { queryKeys } from "@/lib/query-keys"
import { profileUpdated } from "@/store/auth-slice"
import { useAppDispatch } from "@/store/hooks"
import type { AdminProfile } from "@/types"

export function useAdminProfile(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminProfile,
    queryFn: fetchAdminProfile,
    enabled,
  })
}

export function useUpdateAdminProfile() {
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()

  return useMutation({
    mutationFn: updateAdminProfile,
    onSuccess: (profile: AdminProfile) => {
      // Write the server's answer straight into the cache, no refetch.
      queryClient.setQueryData(queryKeys.adminProfile, profile)
      // Keep the header and menu in step with the saved name.
      const name =
        [profile.first_name, profile.middle_name, profile.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() || "Admin"
      dispatch(profileUpdated({ name, email: profile.email }))
    },
  })
}
