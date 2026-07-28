const percentageFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

export function formatProbability(probability: number): string {
  if (!Number.isFinite(probability)) {
    return "Unavailable"
  }

  const boundedProbability = Math.min(1, Math.max(0, probability))
  return percentageFormatter.format(boundedProbability)
}
