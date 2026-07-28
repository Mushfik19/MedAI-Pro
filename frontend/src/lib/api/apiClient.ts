import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios"
import type {
  AuthTokenProvider,
  RefreshAccessToken,
} from "@/lib/api/authTokenProvider"
import { normalizeApiError } from "@/lib/api/apiError"
import { RefreshCoordinator } from "@/lib/api/refreshCoordinator"
import { notifySessionExpired } from "@/state/auth/authSessionEvents"

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _authRetry?: boolean
}

export interface ApiClientOptions {
  baseUrl: string
  tokenProvider?: AuthTokenProvider
  refreshAccessToken?: RefreshAccessToken
  timeoutMs?: number
}

function createRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

export function createApiClient(options: ApiClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL: options.baseUrl,
    timeout: options.timeoutMs ?? 15_000,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    withCredentials: true,
  })

  const refreshCoordinator = options.refreshAccessToken
    ? new RefreshCoordinator(options.refreshAccessToken)
    : null

  client.interceptors.request.use((request) => {
    const headers = AxiosHeaders.from(request.headers)
    headers.set("X-Request-ID", createRequestId())

    const accessToken = options.tokenProvider?.getAccessToken()
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`)
    }
    const csrfToken = options.tokenProvider?.getCsrfToken?.()
    if (csrfToken && request.url?.startsWith("/auth/")) {
      headers.set("X-CSRF-Token", csrfToken)
    }

    request.headers = headers
    return request
  })

  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const request = error.config as RetriableRequestConfig | undefined

        if (
          error.response?.status === 401 &&
          request &&
          !request._authRetry &&
          !request.url?.startsWith("/auth/") &&
          refreshCoordinator
        ) {
          request._authRetry = true
          try {
            await refreshCoordinator.refresh()
            return client.request(request)
          } catch (refreshError) {
            notifySessionExpired()
            throw normalizeApiError(refreshError)
          }
        }
      }

      throw normalizeApiError(error)
    },
  )

  return client
}
