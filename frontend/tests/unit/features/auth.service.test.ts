import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "@/lib/api"
import { authTokenStore } from "@/state/auth/authTokenStore"
import { authService } from "@/features/auth/api/auth.service"

vi.mock("@/lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...original,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
    },
  }
})

const loginResponse = {
  data: {
    data: {
      status: "AUTHENTICATED",
      access_token: "access-token",
      token_type: "bearer",
      expires_in: 900,
      csrf_token: "c".repeat(32),
    },
    meta: { request_id: "request-id" },
  },
}

const currentUserResponse = {
  data: {
    data: {
      id: "a4c958e7-0ad0-4cad-84c8-6a9147282654",
      email: "patient@example.com",
      display_name: "Test Patient",
      role: "PATIENT",
      permissions: [],
    },
    meta: { request_id: "request-id" },
  },
}

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authTokenStore.clear()
  })

  it("can log in when passed to a mutation as an unbound function", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(loginResponse)
    vi.mocked(apiClient.get).mockResolvedValue(currentUserResponse)

    const login = authService.login
    const result = await login({
      email: "patient@example.com",
      password: "Password123",
    })

    expect(result.status).toBe("AUTHENTICATED")
    if (result.status === "AUTHENTICATED") {
      expect(result.session.user.displayName).toBe("Test Patient")
    }
    expect(apiClient.get).toHaveBeenCalledWith("/auth/me")
  })
})
