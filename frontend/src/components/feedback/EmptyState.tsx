import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export interface EmptyStateProps {
  title: string
  description: string
  icon?: LucideIcon
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  action,
  className,
  description,
  icon: Icon,
  title,
}: EmptyStateProps): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-8 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon aria-hidden="true" className="size-6" />
        </div>
      ) : null}
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  )
}
