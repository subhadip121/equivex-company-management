import { useMutation } from "@tanstack/react-query"
import { requestPasswordReset, resetPassword, verifyResetCode } from "@/api/password-reset"

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset })
}

export function useVerifyResetCode() {
  return useMutation({ mutationFn: verifyResetCode })
}

export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword })
}
