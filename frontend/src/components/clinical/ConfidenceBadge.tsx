import { Badge } from "@/components/ui/badge"
import type { Confidence } from "@/features/predictions/domain/prediction.schemas"

export function ConfidenceBadge({
  confidence,
}: {
  confidence: Confidence
}): React.JSX.Element {
  const variant =
    confidence === "HIGH"
      ? "success"
      : confidence === "MEDIUM"
        ? "warning"
        : "outline"

  return (
    <Badge variant={variant}>
      {confidence.charAt(0) + confidence.slice(1).toLowerCase()} confidence
    </Badge>
  )
}
