import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:bg-blue-700 dark:hover:bg-blue-400",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-slate-200 dark:hover:bg-slate-700",
        outline:
          "border border-border bg-background text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-red-700 dark:hover:bg-red-500",
        emergency:
          "bg-emergency text-emergency-foreground shadow-sm hover:bg-red-800 dark:hover:bg-red-700",
        link: "min-h-0 rounded-none px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11",
        sm: "h-9 min-h-9 rounded-sm px-3 text-sm",
        lg: "h-13 min-h-13 rounded-lg px-6 text-base",
        icon: "size-11 min-h-11 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
)
