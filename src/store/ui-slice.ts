import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

const STORAGE_KEY = "equivex.theme"

export type Theme = "light" | "dark"

export interface UiState {
  theme: Theme
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark") return stored
  } catch {
    // storage unavailable; fall through to the system preference
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

const initialState: UiState = {
  theme: readStoredTheme(),
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    themeToggled(state) {
      state.theme = state.theme === "dark" ? "light" : "dark"
    },
    themeSet(state, action: PayloadAction<Theme>) {
      state.theme = action.payload
    },
  },
  selectors: {
    selectTheme: (state) => state.theme,
  },
})

export const THEME_STORAGE_KEY = STORAGE_KEY
export const { themeToggled, themeSet } = uiSlice.actions
export const { selectTheme } = uiSlice.selectors
export default uiSlice.reducer
