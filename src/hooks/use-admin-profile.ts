import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { changeAdminPassword, fetchAdminProfile, updateAdminProfile } from "@/api/auth"
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

function displayName(profile: AdminProfile) {
  return (
    [profile.first_name, profile.middle_name, profile.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || "Admin"
  )
}

export function useUpdateAdminProfile() {
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()

  return useMutation({
    mutationFn: updateAdminProfile,
    onSuccess: async (saved, submitted) => {
      // The endpoint may answer { status, message } rather than the saved
      // record, so fall back to the values we just sent.
      const next = saved ?? submitted

      queryClient.setQueryData<AdminProfile>(queryKeys.adminProfile, (current) => ({
        ...(current ?? submitted),
        ...next,
      }))
      dispatch(profileUpdated({ name: displayName(next), email: next.email }))

      // Then confirm against the server, in case it normalised anything.
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminProfile })
    },
  })
}

export function useChangeAdminPassword() {
  return useMutation({ mutationFn: changeAdminPassword })
}
