import {
  dashboardSummarySchema,
  dashboardTrendSchema,
  diseaseFrequencySchema,
  weeklyReportSchema,
} from "@/features/dashboard/api/dashboard.schemas"
import { apiClient } from "@/lib/api"
import { createEnvelopeSchema, parseResponse } from "@/lib/api/parseResponse"

export const dashboardService = {
  async getDashboard() {
    const [summaryResponse, trendResponse, frequencyResponse, reportResponse] =
      await Promise.all([
        apiClient.get("/dashboard/summary", { params: { period: "30d" } }),
        apiClient.get("/dashboard/trends", {
          params: { period: "7d", interval: "day" },
        }),
        apiClient.get("/dashboard/disease-frequency", {
          params: { period: "90d" },
        }),
        apiClient.get("/dashboard/reports/weekly"),
    ])
    return {
      summary: parseResponse(
        createEnvelopeSchema(dashboardSummarySchema),
        summaryResponse.data,
      ).data,
      trend: parseResponse(
        createEnvelopeSchema(dashboardTrendSchema),
        trendResponse.data,
      ).data,
      frequency: parseResponse(
        createEnvelopeSchema(diseaseFrequencySchema),
        frequencyResponse.data,
      ).data,
      weeklyReport: parseResponse(
        createEnvelopeSchema(weeklyReportSchema),
        reportResponse.data,
      ).data,
    }
  },
}
