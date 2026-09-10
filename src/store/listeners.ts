import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { setAuthToken } from "@/api/http"
import { queryClient } from "@/lib/query-client"
import { AUTH_STORAGE_KEY, sessionEnded, sessionStarted } from "@/store/auth-slice"
import { THEME_STORAGE_KEY, themeSet, themeToggled } from "@/store/ui-slice"
import type { RootState } from "@/store"

export const listenerMiddleware = createListenerMiddleware()

/** Persist the session so a refresh keeps the user signed in. */
listenerMiddleware.startListening({
  actionCreator: sessionStarted,
  effect: (action) => {
    setAuthToken(action.payload.token)
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(action.payload))
    } catch {
      // storage unavailable; session stays in memory only
    }
  },
})

/** Signing out clears storage and the query cache together. */
listenerMiddleware.startListening({
  actionCreator: sessionEnded,
  effect: () => {
    setAuthToken(null)
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } catch {
      // nothing to clean up
    }
    // Never leave one account's data in the cache for the next sign-in.
    queryClient.clear()
  },
})

/** Apply and persist the theme without an effect in a component. */
listenerMiddleware.startListening({
  matcher: isAnyOf(themeToggled, themeSet),
  effect: (_action, api) => {
    const { theme } = (api.getState() as RootState).ui
    document.documentElement.classList.toggle("dark", theme === "dark")
    document.documentElement.style.colorScheme = theme
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // storage unavailable; theme resets on reload
    }
  },
})
