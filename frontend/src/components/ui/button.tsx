import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"
import type { VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"
import { buttonVariants } from "@/components/ui/button.variants"
import { cn } from "@/lib/utils/cn"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      children,
      className,
      disabled,
      loading = false,
      size,
      type = "button",
      variant,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : "button"

    return (
      <Component
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={asChild ? undefined : disabled || loading}
        ref={ref}
        type={asChild ? undefined : type}
        {...props}
      >
        {loading ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" />
        ) : null}
        {asChild ? <Slottable>{children}</Slottable> : children}
      </Component>
    )
  },
)
Button.displayName = "Button"

export { Button }
