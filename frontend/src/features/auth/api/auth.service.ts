import {
  authUserSchema,
  loginResultSchema,
  registrationResultSchema,
} from "@/features/auth/api/auth.schemas"
import { refreshAccessToken } from "@/features/auth/api/auth.refresh"
import { apiClient } from "@/lib/api"
import { createEnvelopeSchema, parseResponse } from "@/lib/api/parseResponse"
import type { AuthSession } from "@/state/auth/auth.types"
import { authTokenStore } from "@/state/auth/authTokenStore"

export interface LoginRequest {
  email: string
  password: string
}

export interface AdminLoginRequest {
  username: string
  password: string
}

export interface RegistrationRequest {
  consent_document_ids: readonly string[]
  display_name: string
  email: string
  password: string
  timezone: string
}

export interface PasswordResetRequest {
  email: string
}

async function getCurrentSession(): Promise<AuthSession> {
  const response = await apiClient.get("/auth/me")
  const user = parseResponse(
    createEnvelopeSchema(authUserSchema),
    response.data,
  ).data
  return { user }
}

export const authService = {
  async login(request: LoginRequest) {
    const response = await apiClient.post("/auth/login", request)
    const result = parseResponse(
      createEnvelopeSchema(loginResultSchema),
      response.data,
    ).data
    authTokenStore.setAccessToken(result.access_token)
    authTokenStore.setCsrfToken(result.csrf_token)
    const session = await getCurrentSession()
    return {
      status: "AUTHENTICATED" as const,
      accessToken: result.access_token,
      csrfToken: result.csrf_token,
      expiresIn: result.expires_in,
      session,
    }
  },

  async adminLogin(request: AdminLoginRequest) {
    const response = await apiClient.post("/auth/admin/login", request)
    const result = parseResponse(
      createEnvelopeSchema(loginResultSchema),
      response.data,
    ).data
    authTokenStore.setAccessToken(result.access_token)
    authTokenStore.setCsrfToken(result.csrf_token)
    const session = await getCurrentSession()
    return {
      status: "AUTHENTICATED" as const,
      accessToken: result.access_token,
      csrfToken: result.csrf_token,
      expiresIn: result.expires_in,
      session,
    }
  },

  async register(request: RegistrationRequest) {
    const response = await apiClient.post("/auth/register", request)
    return parseResponse(
      createEnvelopeSchema(registrationResultSchema),
      response.data,
    ).data
  },

  async refresh(): Promise<string> {
    return refreshAccessToken()
  },

  async getCurrentSession(): Promise<AuthSession> {
    return getCurrentSession()
  },

  async requestPasswordReset(request: PasswordResetRequest): Promise<void> {
    await apiClient.post("/auth/forgot-password", request)
  },

  async restoreSession(): Promise<{ accessToken: string; session: AuthSession }> {
    const accessToken = await this.refresh()
    const session = await this.getCurrentSession()
    return { accessToken, session }
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout")
  },
}
