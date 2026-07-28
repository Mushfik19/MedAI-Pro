import { CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"

export interface ErrorStateProps {
  title: string
  description: string
  children?: React.ReactNode
  requestId?: string | undefined
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  className,
  children,
  description,
  onRetry,
  requestId,
  title,
}: ErrorStateProps): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center",
        className,
      )}
      role="alert"
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
        <CircleAlert aria-hidden="true" className="size-6" />
      </div>
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {requestId ? (
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Request ID: {requestId}
        </p>
      ) : null}
      {onRetry ? (
        <Button className="mt-6" onClick={onRetry} variant="outline">
          Try again
        </Button>
      ) : null}
      {children}
    </section>
  )
}
