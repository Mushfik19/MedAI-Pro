import * as React from "react"
import { cn } from "@/lib/utils/cn"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => {
    const normalizedValue = Math.min(100, Math.max(0, value))

    return (
      <div
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={normalizedValue}
        className={cn("h-2 overflow-hidden rounded-full bg-muted", className)}
        ref={ref}
        role="progressbar"
        {...props}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    )
  },
)
Progress.displayName = "Progress"
