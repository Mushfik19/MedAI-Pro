import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils/cn"

export interface StatCardProps {
  label: string
  value: string
  context: string
  icon: LucideIcon
  trend?: {
    value: string
    direction: "up" | "down"
  }
  tone?: "blue" | "cyan" | "violet" | "amber" | "rose" | "green"
}

const toneClasses = {
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  violet:
    "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  green: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
} as const

export function StatCard({
  context,
  icon: Icon,
  label,
  tone = "blue",
  trend,
  value,
}: StatCardProps): React.JSX.Element {
  const TrendIcon = trend?.direction === "down" ? ArrowDownRight : ArrowUpRight

  return (
    <Card className="overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_14px_40px_rgb(37_99_235/0.08)]">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-3xl font-extrabold tracking-[-0.04em]">
              {value}
            </p>
          </div>
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl",
              toneClasses[tone],
            )}
          >
            <Icon aria-hidden="true" className="size-5" />
          </div>
        </div>
        <div className="mt-3 flex min-h-5 items-center gap-2 text-[0.6875rem] text-muted-foreground">
          {trend ? (
            <span className="inline-flex items-center gap-1 font-semibold text-green-700 dark:text-green-300">
              <TrendIcon aria-hidden="true" className="size-3.5" />
              {trend.value}
            </span>
          ) : null}
          <span>{context}</span>
        </div>
      </CardContent>
    </Card>
  )
}
