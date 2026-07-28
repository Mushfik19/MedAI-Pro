import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"

const alertVariants = cva(
  "relative w-full rounded-md border p-4 [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-5 [&>svg~*]:pl-8",
  {
    variants: {
      variant: {
        info: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
        success:
          "border-green-200 bg-green-50 text-green-950 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
        warning:
          "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
        danger:
          "border-red-200 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
        emergency:
          "border-red-300 bg-red-900 text-white dark:border-red-500 dark:bg-red-950",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, role, variant, ...props }, ref) => (
    <div
      className={cn(alertVariants({ variant }), className)}
      ref={ref}
      role={role ?? (variant === "danger" || variant === "emergency" ? "alert" : "status")}
      {...props}
    />
  ),
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    className={cn("mb-1 font-display text-base font-semibold", className)}
    ref={ref}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn("text-sm leading-6 [&_p]:leading-6", className)}
    ref={ref}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription, AlertTitle }
