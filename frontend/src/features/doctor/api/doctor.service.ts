import {
  doctorDashboardSchema,
  doctorPatientsEnvelopeSchema,
} from "@/features/doctor/api/doctor.schemas"
import { apiClient, createIdempotencyKey } from "@/lib/api"
import { createEnvelopeSchema, parseResponse } from "@/lib/api/parseResponse"

export const doctorService = {
  async getWorkspace(search: string) {
    const [dashboardResponse, patientsResponse] = await Promise.all([
      apiClient.get("/doctor/dashboard"),
      apiClient.get("/doctor/patients", {
        params: { query: search || undefined },
      }),
    ])
    return {
      dashboard: parseResponse(
        createEnvelopeSchema(doctorDashboardSchema),
        dashboardResponse.data,
      ).data,
      patients: parseResponse(
        doctorPatientsEnvelopeSchema,
        patientsResponse.data,
      ).data,
    }
  },

  async createNote({
    content,
    predictionId,
  }: {
    content: string
    predictionId: string
  }): Promise<void> {
    await apiClient.post(
      `/doctor/predictions/${predictionId}/notes`,
      { content, disposition: "FOLLOW_UP_REQUIRED", sign: true },
      { headers: { "Idempotency-Key": createIdempotencyKey() } },
    )
  },

  async queueReport(predictionId: string): Promise<void> {
    await apiClient.post(
      `/doctor/reports/${predictionId}`,
      {},
      { headers: { "Idempotency-Key": createIdempotencyKey() } },
    )
  },
}
