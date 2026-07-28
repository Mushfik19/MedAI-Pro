import { z } from "zod"
import { ApiError } from "@/lib/api/apiError"
import {
  createEnvelopeSchema,
  parseResponse,
} from "@/lib/api/parseResponse"

describe("parseResponse", () => {
  const schema = createEnvelopeSchema(
    z.object({ id: z.uuid(), status: z.literal("READY") }),
  )

  it("returns data that matches the approved envelope contract", () => {
    const payload = {
      data: {
        id: "7cc36bb4-dc73-4a82-afc0-8a30ce28ad72",
        status: "READY",
      },
      meta: { request_id: "01J4E9CME5G6D1JYF0D8XASR9T" },
    }

    expect(parseResponse(schema, payload).data.status).toBe("READY")
  })

  it("converts malformed success payloads into a safe API contract error", () => {
    let capturedError: unknown
    try {
      parseResponse(schema, {
        data: { id: "not-a-uuid", status: "UNKNOWN" },
        meta: {},
      })
    } catch (error) {
      capturedError = error
    }

    expect(capturedError).toBeInstanceOf(ApiError)
    expect((capturedError as ApiError).status).toBe(502)
  })
})
