import * as React from "react"
import { cn } from "@/lib/utils/cn"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-28 w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 md:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Textarea.displayName = "Textarea"

export { Textarea }
