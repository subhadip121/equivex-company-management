import { useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectToken, selectUser, sessionEnded, sessionStarted } from "@/store/auth-slice"
import type { Session } from "@/types"

/**
 * Thin facade over the auth slice so components do not reach into the
 * store shape directly.
 */
export function useAuth() {
  const user = useAppSelector(selectUser)
  const token = useAppSelector(selectToken)
  const dispatch = useAppDispatch()

  const setSession = useCallback(
    (session: Session) => dispatch(sessionStarted(session)),
    [dispatch],
  )

  const endSession = useCallback(() => dispatch(sessionEnded()), [dispatch])

  return { user, token, setSession, endSession }
}
