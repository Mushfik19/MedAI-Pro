import axios from "axios"
import { applicationConfig } from "@/app/applicationConfig"
import { accessTokenSchema } from "@/features/auth/api/auth.schemas"
import { createEnvelopeSchema, parseResponse } from "@/lib/api/parseResponse"
import { authTokenStore } from "@/state/auth/authTokenStore"

const refreshClient = axios.create({
  baseURL: applicationConfig.apiBaseUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: { Accept: "application/json" },
})

export async function refreshAccessToken(): Promise<string> {
  const csrfToken = authTokenStore.getCsrfToken()
  const response = await refreshClient.post(
    "/auth/refresh",
    undefined,
    csrfToken ? { headers: { "X-CSRF-Token": csrfToken } } : {},
  )
  const result = parseResponse(
    createEnvelopeSchema(accessTokenSchema),
    response.data,
  ).data
  authTokenStore.setAccessToken(result.accessToken)
  authTokenStore.setCsrfToken(result.csrfToken)
  return result.accessToken
}
