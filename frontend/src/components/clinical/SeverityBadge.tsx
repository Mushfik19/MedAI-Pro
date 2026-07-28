import { Badge } from "@/components/ui/badge"
import type { Severity } from "@/features/predictions/domain/prediction.schemas"

export function SeverityBadge({
  severity,
}: {
  severity: Severity
}): React.JSX.Element {
  const variant =
    severity === "LOW"
      ? "success"
      : severity === "MODERATE"
        ? "warning"
        : "danger"

  return (
    <Badge variant={variant}>
      {severity.charAt(0) + severity.slice(1).toLowerCase()} severity
    </Badge>
  )
}
