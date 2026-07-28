export interface AuthTokenProvider {
  getAccessToken(): string | null
  getCsrfToken?(): string | null
}

export type RefreshAccessToken = () => Promise<void>
