import { formatDateTime } from "@/lib/formatters/dateTime"
import { formatProbability } from "@/lib/formatters/probability"

describe("formatProbability", () => {
  it("formats valid probabilities and bounds invalid ranges", () => {
    expect(formatProbability(0.812)).toBe("81.2%")
    expect(formatProbability(2)).toBe("100%")
    expect(formatProbability(-1)).toBe("0%")
  })

  it("returns a safe label for non-finite values", () => {
    expect(formatProbability(Number.NaN)).toBe("Unavailable")
  })
})

describe("formatDateTime", () => {
  it("formats a valid date with an explicit locale and timezone", () => {
    expect(
      formatDateTime("2026-07-26T14:12:45Z", {
        locale: "en-US",
        timeZone: "UTC",
      }),
    ).toBe("Jul 26, 2026, 2:12 PM")
  })

  it("returns a safe label for invalid dates", () => {
    expect(formatDateTime("not-a-date")).toBe("Unavailable")
  })
})
