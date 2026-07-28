import { cva } from "class-variance-authority"

export const badgeVariants = cva(
  "inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-transparent text-foreground",
        success:
          "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
        warning:
          "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
        danger:
          "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)
