export class ApiError extends Error {
  status: number
  /** The parsed error body, when the server sent one. */
  details: unknown

  constructor(message: string, status = 500, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}
