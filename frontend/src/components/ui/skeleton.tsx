import type * as React from "react"
import { cn } from "@/lib/utils/cn"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}
