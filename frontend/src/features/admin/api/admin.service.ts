import {
  adminAnalyticsSchema,
  adminAssessmentSchema,
  adminChatSchema,
  adminDatasetSchema,
  adminModelSchema,
  adminUserSchema,
  auditEventSchema,
  collectionEnvelope,
  systemHealthSchema,
} from "@/features/admin/api/admin.schemas"
import { apiClient, createIdempotencyKey } from "@/lib/api"
import { createEnvelopeSchema, parseResponse } from "@/lib/api/parseResponse"

export const adminService = {
  async getAnalytics() {
    const response = await apiClient.get("/admin/analytics/summary")
    return parseResponse(createEnvelopeSchema(adminAnalyticsSchema), response.data).data
  },

  async getUsers(params: { search?: string; role?: string; status?: string } = {}) {
    const response = await apiClient.get("/admin/users", {
      params: { limit: 100, ...params },
    })
    return parseResponse(collectionEnvelope(adminUserSchema), response.data).data
  },

  async updateUser(input: { id: string; status: "ACTIVE" | "SUSPENDED" }) {
    await apiClient.patch(`/admin/users/${input.id}`, { status: input.status })
  },

  async deleteUser(id: string) {
    await apiClient.delete(`/admin/users/${id}`)
  },

  async getAssessments(search = "") {
    const response = await apiClient.get("/admin/assessments", {
      params: { limit: 100, search },
    })
    return parseResponse(collectionEnvelope(adminAssessmentSchema), response.data).data
  },

  async getChats() {
    const response = await apiClient.get("/admin/chats", { params: { limit: 100 } })
    return parseResponse(collectionEnvelope(adminChatSchema), response.data).data
  },

  async getSystemHealth() {
    const response = await apiClient.get("/admin/system-health")
    return parseResponse(createEnvelopeSchema(systemHealthSchema), response.data).data
  },

  async getDashboard() {
    const [analytics, users, models, datasets, audit] = await Promise.all([
      apiClient.get("/admin/analytics/summary"),
      apiClient.get("/admin/users", { params: { limit: 5, sort: "-created_at" } }),
      apiClient.get("/admin/models", { params: { limit: 10 } }),
      apiClient.get("/admin/datasets", { params: { limit: 5, sort: "-created_at" } }),
      apiClient.get("/admin/audit-logs", { params: { limit: 6, sort: "-occurred_at" } }),
    ])
    return {
      analytics: parseResponse(
        createEnvelopeSchema(adminAnalyticsSchema),
        analytics.data,
      ).data,
      users: parseResponse(collectionEnvelope(adminUserSchema), users.data).data,
      models: parseResponse(collectionEnvelope(adminModelSchema), models.data).data,
      datasets: parseResponse(collectionEnvelope(adminDatasetSchema), datasets.data).data,
      audit: parseResponse(collectionEnvelope(auditEventSchema), audit.data).data,
    }
  },

  async uploadDataset({ file, name }: { file: File; name: string }): Promise<void> {
    const form = new FormData()
    form.set("file", file)
    form.set("name", name)
    await apiClient.post("/admin/datasets", form, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Idempotency-Key": createIdempotencyKey(),
      },
      timeout: 60_000,
    })
  },

  async startTraining(datasetId: string): Promise<void> {
    await apiClient.post(
      "/admin/training-jobs",
      { dataset_id: datasetId },
      { headers: { "Idempotency-Key": createIdempotencyKey() } },
    )
  },
}
