import {
  persistentAssessmentSchema,
  predictionHistorySchema,
  predictionSchema,
  symptomSchema,
} from "@/features/predictions/domain/prediction.schemas"
import { apiClient, createIdempotencyKey } from "@/lib/api"
import { createEnvelopeSchema, parseResponse } from "@/lib/api/parseResponse"
import { z } from "zod"

export interface CreatePredictionRequest {
  symptoms: Array<{
    symptom_id: string
    intensity: number
    duration_days: number
    is_present: true
  }>
  informed_use_accepted: true
}

export interface PredictionHistoryFilters {
  cursor?: string
  query?: string
  reviewStatus?: string
}

export const predictionService = {
  async listSymptoms(search: string) {
    const response = await apiClient.get("/catalog/symptoms", {
      params: { active: true, search: search || undefined },
    })
    return parseResponse(
      createEnvelopeSchema(symptomSchema.array()),
      response.data,
    ).data
  },

  async create(request: CreatePredictionRequest) {
    const response = await apiClient.post("/predictions", request, {
      headers: { "Idempotency-Key": createIdempotencyKey() },
    })
    return parseResponse(
      createEnvelopeSchema(predictionSchema),
      response.data,
    ).data
  },

  async listHistory(filters: PredictionHistoryFilters) {
    const response = await apiClient.get("/predictions", {
      params: {
        cursor: filters.cursor,
        query: filters.query || undefined,
        review_status:
          filters.reviewStatus === "all" ? undefined : filters.reviewStatus,
      },
    })
    return parseResponse(predictionHistorySchema, response.data)
  },

  async getAssessment(predictionId: string) {
    const response = await apiClient.get(`/predictions/${predictionId}`)
    return parseResponse(
      createEnvelopeSchema(persistentAssessmentSchema),
      response.data,
    ).data
  },

  async requestHistoryExport(): Promise<Blob> {
    const response = await apiClient.post(
      "/users/me/data-export",
      { resource_types: ["PREDICTIONS"], format: "CSV" },
      {
        headers: { "Idempotency-Key": createIdempotencyKey() },
        responseType: "blob",
      },
    )
    return response.data as Blob
  },

  async getReportDownload(predictionId: string): Promise<string> {
    const response = await apiClient.get(`/predictions/${predictionId}/report`)
    const downloadUrl = parseResponse(
      createEnvelopeSchema(
        z.object({
          status: z.literal("READY"),
          download_url: z.url(),
        }),
      ),
      response.data,
    ).data.download_url
    const report = await apiClient.get<Blob>(downloadUrl, {
      responseType: "blob",
    })
    return URL.createObjectURL(report.data)
  },
}
