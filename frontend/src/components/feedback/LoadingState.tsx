import { LoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export interface LoadingStateProps {
  label?: string
  className?: string
}

export function LoadingState({
  className,
  label = "Loading",
}: LoadingStateProps): React.JSX.Element {
  return (
    <div
      aria-live="polite"
      className={cn(
        "flex min-h-40 flex-col items-center justify-center gap-3 text-center text-muted-foreground",
        className,
      )}
      role="status"
    >
      <LoaderCircle aria-hidden="true" className="size-6 animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
