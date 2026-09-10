import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { setAuthToken } from "@/api/http"
import type { AuthUser, Session } from "@/types"

const STORAGE_KEY = "equivex.auth.session"

export interface AuthState {
  user: AuthUser | null
  token: string | null
}

function readStoredSession(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { user: null, token: null }
    const stored = JSON.parse(raw) as Session
    return { user: stored.user ?? null, token: stored.token ?? null }
  } catch {
    return { user: null, token: null }
  }
}

const initialState: AuthState = readStoredSession()

// The fetch wrapper needs the restored token before the first request.
setAuthToken(initialState.token)

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionStarted(state, action: PayloadAction<Session>) {
      state.user = action.payload.user
      state.token = action.payload.token
    },
    sessionEnded(state) {
      state.user = null
      state.token = null
    },
    profileUpdated(state, action: PayloadAction<{ name: string; email: string }>) {
      if (state.user) {
        state.user.name = action.payload.name
        state.user.email = action.payload.email
      }
    },
  },
  selectors: {
    selectUser: (state) => state.user,
    selectToken: (state) => state.token,
    selectIsAuthenticated: (state) => state.user !== null,
    selectRole: (state) => state.user?.role ?? null,
  },
})

export const AUTH_STORAGE_KEY = STORAGE_KEY
export const { sessionStarted, sessionEnded, profileUpdated } = authSlice.actions
export const { selectUser, selectToken, selectIsAuthenticated, selectRole } = authSlice.selectors
export default authSlice.reducer
