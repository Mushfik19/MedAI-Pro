import * as React from "react"
import { cn } from "@/lib/utils/cn"

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn(
      "relative flex size-10 shrink-0 overflow-hidden rounded-full",
      className,
    )}
    ref={ref}
    {...props}
  />
))
Avatar.displayName = "Avatar"

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn(
      "flex size-full items-center justify-center rounded-full bg-muted",
      className,
    )}
    ref={ref}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback }
