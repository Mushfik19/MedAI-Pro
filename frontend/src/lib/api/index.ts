import { applicationConfig } from "@/app/applicationConfig"
import { refreshAccessToken } from "@/features/auth/api/auth.refresh"
import { createApiClient } from "@/lib/api/apiClient"
import { authTokenStore } from "@/state/auth/authTokenStore"

export const apiClient = createApiClient({
  baseUrl: applicationConfig.apiBaseUrl,
  tokenProvider: authTokenStore,
  refreshAccessToken: async () => void (await refreshAccessToken()),
})

export type { ApiClientOptions } from "@/lib/api/apiClient"
export { ApiError, normalizeApiError } from "@/lib/api/apiError"
export type {
  ApiCollectionEnvelope,
  ApiEnvelope,
  CursorMeta,
  ResponseMeta,
} from "@/lib/api/contracts"
export { createIdempotencyKey } from "@/lib/api/idempotency"
export type { FieldProblem, ProblemDetails } from "@/lib/api/problemDetails"
