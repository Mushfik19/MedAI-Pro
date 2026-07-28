import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { badgeVariants } from "@/components/ui/badge.variants"
import { cn } from "@/lib/utils/cn"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps): React.JSX.Element {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge }
