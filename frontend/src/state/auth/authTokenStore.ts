import type { AuthTokenProvider } from "@/lib/api/authTokenProvider"

const csrfStorageKey = "mediai.csrf"

function readStoredCsrfToken(): string | null {
  try {
    return globalThis.sessionStorage?.getItem(csrfStorageKey) ?? null
  } catch {
    return null
  }
}

function storeCsrfToken(value: string | null): void {
  try {
    if (value) {
      globalThis.sessionStorage?.setItem(csrfStorageKey, value)
    } else {
      globalThis.sessionStorage?.removeItem(csrfStorageKey)
    }
  } catch {
    // Session storage can be unavailable in hardened browser contexts.
  }
}

class MemoryAuthTokenStore implements AuthTokenProvider {
  private accessToken: string | null = null
  private csrfToken: string | null = readStoredCsrfToken()

  public getAccessToken(): string | null {
    return this.accessToken
  }

  public setAccessToken(accessToken: string): void {
    this.accessToken = accessToken
  }

  public getCsrfToken(): string | null {
    return this.csrfToken
  }

  public setCsrfToken(csrfToken: string): void {
    this.csrfToken = csrfToken
    storeCsrfToken(csrfToken)
  }

  public clear(): void {
    this.accessToken = null
    this.csrfToken = null
    storeCsrfToken(null)
  }
}

export const authTokenStore = new MemoryAuthTokenStore()
