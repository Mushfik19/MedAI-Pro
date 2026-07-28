import type * as React from "react"
import { cn } from "@/lib/utils/cn"

export interface PageContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  size?: "reading" | "default" | "wide"
}

const sizeClasses: Record<NonNullable<PageContainerProps["size"]>, string> = {
  reading: "max-w-3xl",
  default: "max-w-7xl",
  wide: "max-w-[90rem]",
}

export function PageContainer({
  className,
  size = "default",
  ...props
}: PageContainerProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
}
