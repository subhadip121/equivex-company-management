import { endpoints } from "@/api/endpoints"
import { delay, http } from "@/api/http"
import { ApiError } from "@/lib/api-error"
import type { UserRole } from "@/types"

/**
 * Admin reset is wired to the real API and keyed on the account's email
 * address. The company endpoints do not exist yet, so that path is still
 * simulated; replace the mocked branches when they land.
 */

export interface ResetRequest {
  accountType: UserRole
  /** Email address for an admin, ISIN for a company. */
  identifier: string
}

/** Code 000000 is rejected in the mocked company path so the error shows. */
const MOCK_REJECTED_CODE = "000000"

export async function requestPasswordReset({
  accountType,
  identifier,
}: ResetRequest): Promise<void> {
  if (accountType === "admin") {
    await http<{ message?: string }>(endpoints.admin.forgotPasswordRequest, {
      method: "POST",
      body: JSON.stringify({ email: identifier }),
    })
    return
  }

  await delay(null, 700)
}

/**
 * The backend verifies the code and sets the new password in one call, so
 * there is no separate verify step to check the code on its own.
 */
export async function resetPasswordWithOtp({
  accountType,
  identifier,
  otp,
  newPassword,
}: ResetRequest & { otp: string; newPassword: string }): Promise<void> {
  if (accountType === "admin") {
    await http<{ message?: string }>(endpoints.admin.verifyOtpAndResetPassword, {
      method: "POST",
      body: JSON.stringify({ email: identifier, otp, new_password: newPassword }),
    })
    return
  }

  await delay(null, 700)
  if (otp === MOCK_REJECTED_CODE) {
    throw new ApiError("That code is incorrect or has expired.", 400)
  }
}
