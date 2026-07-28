import type { ReactNode } from "react"
import { cn } from "@/lib/utils/cn"

export interface PageHeaderProps {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  actions,
  className,
  description,
  eyebrow,
  title,
}: PageHeaderProps): React.JSX.Element {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-[0.6875rem] font-extrabold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-[2.75rem] dark:text-white">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </header>
  )
}
