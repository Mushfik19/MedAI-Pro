import {
  sessionsEnvelopeSchema,
  settingsSchema,
  type Settings,
} from "@/features/settings/api/settings.schemas"
import { apiClient, createIdempotencyKey } from "@/lib/api"
import { createEnvelopeSchema, parseResponse } from "@/lib/api/parseResponse"

export const settingsService = {
  async get() {
    const [settingsResponse, sessionsResponse] = await Promise.all([
      apiClient.get("/users/me/settings"),
      apiClient.get("/auth/sessions"),
    ])
    return {
      settings: parseResponse(
        createEnvelopeSchema(settingsSchema),
        settingsResponse.data,
      ).data,
      sessions: parseResponse(sessionsEnvelopeSchema, sessionsResponse.data).data,
    }
  },

  async update(values: Partial<Settings>) {
    const response = await apiClient.patch("/users/me/settings", values)
    return parseResponse(
      createEnvelopeSchema(settingsSchema),
      response.data,
    ).data
  },

  async requestExport(): Promise<void> {
    await apiClient.post(
      "/users/me/data-export",
      { resource_types: ["ALL"], format: "JSON" },
      { headers: { "Idempotency-Key": createIdempotencyKey() } },
    )
  },

  async requestDeletion(): Promise<void> {
    await apiClient.post(
      "/users/me/deletion-request",
      { confirmation: "DELETE_MY_ACCOUNT" },
      { headers: { "Idempotency-Key": createIdempotencyKey() } },
    )
  },
}
