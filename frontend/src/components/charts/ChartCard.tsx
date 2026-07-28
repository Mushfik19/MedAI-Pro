import type { ReactNode } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface ChartCardProps {
  title: string
  description: string
  children: ReactNode
  action?: ReactNode
}

export function ChartCard({
  action,
  children,
  description,
  title,
}: ChartCardProps): React.JSX.Element {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent className="pt-1">{children}</CardContent>
    </Card>
  )
}
