import { useMutation } from "@tanstack/react-query"
import { requestPasswordReset, resetPasswordWithOtp } from "@/api/password-reset"

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset })
}

export function useResetPasswordWithOtp() {
  return useMutation({ mutationFn: resetPasswordWithOtp })
}
