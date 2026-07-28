import { ApiError, normalizeApiError } from "@/lib/api/apiError"

describe("normalizeApiError", () => {
  it("keeps an existing ApiError unchanged", () => {
    const error = new ApiError({
      type: "https://api.mediai.pro/problems/forbidden",
      title: "Forbidden",
      status: 403,
      detail: "Access is not permitted.",
      request_id: "request-123",
    })

    expect(normalizeApiError(error)).toBe(error)
    expect(error.requestId).toBe("request-123")
  })

  it("normalizes unknown failures without exposing internals", () => {
    const error = normalizeApiError(new Error("private failure detail"))

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
    expect(error.message).toBe("Please check your connection and try again.")
  })
})
