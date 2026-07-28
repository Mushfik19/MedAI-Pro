import { Activity } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils/cn"

export interface BrandMarkProps {
  className?: string
  compact?: boolean
}

export function BrandMark({
  className,
  compact = false,
}: BrandMarkProps): React.JSX.Element {
  return (
    <Link
      aria-label="MediAI Pro home"
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-md font-display text-lg font-bold tracking-tight text-foreground",
        className,
      )}
      to="/"
    >
      <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
        <Activity aria-hidden="true" className="size-5" />
      </span>
      {compact ? null : <span>MediAI Pro</span>}
    </Link>
  )
}
