import type { RefreshAccessToken } from "@/lib/api/authTokenProvider"

export class RefreshCoordinator {
  private activeRefresh: Promise<void> | null = null

  public constructor(private readonly refreshAccessToken: RefreshAccessToken) {}

  public refresh(): Promise<void> {
    if (this.activeRefresh) {
      return this.activeRefresh
    }

    this.activeRefresh = this.refreshAccessToken().finally(() => {
      this.activeRefresh = null
    })

    return this.activeRefresh
  }
}
