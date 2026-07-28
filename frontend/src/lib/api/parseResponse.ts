import { z } from "zod"
import { ApiError } from "@/lib/api/apiError"

const responseMetaSchema = z.object({
  request_id: z.string().min(1),
})

export function createEnvelopeSchema<TSchema extends z.ZodType>(
  dataSchema: TSchema,
) {
  return z.object({
    data: dataSchema,
    meta: responseMetaSchema,
  })
}

export function parseResponse<TSchema extends z.ZodType>(
  schema: TSchema,
  payload: unknown,
): z.output<TSchema> {
  const result = schema.safeParse(payload)
  if (!result.success) {
    throw new ApiError(
      {
        type: "https://mediai.example/problems/api-contract",
        title: "Invalid API response",
        status: 502,
        detail:
          "The server returned data that does not match the approved application contract.",
      },
      { cause: result.error },
    )
  }
  return result.data
}
