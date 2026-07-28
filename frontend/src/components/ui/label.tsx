import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils/cn"

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    className={cn(
      "text-sm font-semibold leading-5 text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className,
    )}
    ref={ref}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
