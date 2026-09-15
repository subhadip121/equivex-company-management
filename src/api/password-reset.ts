import { delay } from "@/api/http"
import { ApiError } from "@/lib/api-error"
import type { UserRole } from "@/types"

/**
 * MOCKED. The password reset endpoints do not exist yet, so these only
 * simulate latency and outcomes to let the screens be exercised. When the
 * API lands, add the paths to endpoints.ts and replace each body with an
 * `http` call; the signatures are what the screens depend on.
 */

export interface ResetRequest {
  accountType: UserRole
  /** ISIN for a company, username for the admin. */
  identifier: string
}

/** Code 000000 is rejected so the error state can be seen. */
const MOCK_REJECTED_CODE = "000000"

export async function requestPasswordReset(request: ResetRequest): Promise<void> {
  await delay(null, 700)
  void request
}

export async function verifyResetCode(
  request: ResetRequest & { code: string },
): Promise<{ resetToken: string }> {
  await delay(null, 600)
  if (request.code === MOCK_REJECTED_CODE) {
    throw new ApiError("That code is incorrect or has expired.", 400)
  }
  return { resetToken: "mock-reset-token" }
}

export async function resetPassword(
  request: ResetRequest & { resetToken: string; newPassword: string },
): Promise<void> {
  await delay(null, 700)
  void request
}
