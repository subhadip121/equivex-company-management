import { useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectTheme, themeToggled } from "@/store/ui-slice"

export function useTheme() {
  const theme = useAppSelector(selectTheme)
  const dispatch = useAppDispatch()

  const toggleTheme = useCallback(() => dispatch(themeToggled()), [dispatch])

  return { theme, toggleTheme }
}
