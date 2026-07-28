import { cn } from "@/lib/utils/cn"

describe("cn", () => {
  it("merges conditional classes and resolves Tailwind conflicts", () => {
    const includeHidden = false
    expect(cn("px-2", includeHidden && "hidden", "px-4", "font-semibold")).toBe(
      "px-4 font-semibold",
    )
  })
})
