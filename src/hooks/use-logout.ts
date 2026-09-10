import { useMutation } from "@tanstack/react-query"
import { logoutAdmin, logoutCompany } from "@/api/auth"
import { useAuth } from "@/hooks/use-auth"

/**
 * Tells the backend first, then clears the local session. The local clear
 * runs even if the request fails, so a user is never stuck signed in.
 */
export function useLogout() {
  const { user, endSession } = useAuth()

  const mutation = useMutation({
    mutationFn: async () => {
      if (user?.role === "admin") {
        await logoutAdmin()
        return
      }
      if (user?.role === "company") {
        await logoutCompany()
      }
    },
    onSettled: () => endSession(),
  })

  return {
    logout: () => mutation.mutate(),
    isLoggingOut: mutation.isPending,
  }
}
