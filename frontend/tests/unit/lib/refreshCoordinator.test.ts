import { RefreshCoordinator } from "@/lib/api/refreshCoordinator"

describe("RefreshCoordinator", () => {
  it("shares a single active refresh across concurrent requests", async () => {
    let releaseRefresh: () => void = () => undefined
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve
    })
    const refresh = vi.fn(() => refreshGate)
    const coordinator = new RefreshCoordinator(refresh)

    const first = coordinator.refresh()
    const second = coordinator.refresh()

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(first).toBe(second)

    releaseRefresh()
    await Promise.all([first, second])

    await coordinator.refresh()
    expect(refresh).toHaveBeenCalledTimes(2)
  })
})
