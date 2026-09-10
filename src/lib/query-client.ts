import { QueryClient } from "@tanstack/react-query"
import { ApiError } from "@/lib/api-error"

/**
 * Defaults tuned for a dashboard: data stays fresh for a minute so moving
 * between screens is instant, and stale data is revalidated in the
 * background instead of blanking the UI.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        // Bad credentials or a missing record will not fix themselves.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false
        }
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})
