import { configureStore } from "@reduxjs/toolkit"
import authReducer from "@/store/auth-slice"
import uiReducer from "@/store/ui-slice"
import { listenerMiddleware } from "@/store/listeners"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
})

/** Applies the persisted theme once, before the first paint of the app. */
export function applyStoredTheme() {
  const { theme } = store.getState().ui
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.style.colorScheme = theme
}

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
