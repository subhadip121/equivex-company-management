import { useEffect } from "react"
import { toast } from "sonner"
import { setSessionExpiredHandler } from "@/api/http"
import { sessionEnded } from "@/store/auth-slice"
import { useAppDispatch } from "@/store/hooks"

/**
 * Ends the session when any request comes back unauthorised. Clearing the
 * user is enough to reach the login screen: the route guard redirects, and
 * it remembers the page so the user returns there after signing in again.
 */
export function SessionExpiryWatcher() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    setSessionExpiredHandler(() => {
      dispatch(sessionEnded())
      toast.error("Your session has expired. Please sign in again.")
    })
    return () => setSessionExpiredHandler(null)
  }, [dispatch])

  return null
}
