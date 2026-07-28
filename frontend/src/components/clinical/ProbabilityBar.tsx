import { formatProbability } from "@/lib/formatters/probability"

export interface ProbabilityBarProps {
  label: string
  probability: number
}

export function ProbabilityBar({
  label,
  probability,
}: ProbabilityBarProps): React.JSX.Element {
  const value = Math.round(Math.min(1, Math.max(0, probability)) * 100)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-semibold tabular-nums">
          {formatProbability(probability)}
        </span>
      </div>
      <div
        aria-label={`${label}: ${value}%`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={value}
        className="h-2.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
