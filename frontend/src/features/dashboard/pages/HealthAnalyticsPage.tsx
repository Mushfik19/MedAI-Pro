import { Activity, ArrowRight, BrainCircuit, TrendingUp } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Link } from "react-router-dom"
import { ChartCard } from "@/components/charts/ChartCard"
import { PageHeader } from "@/components/data-display/PageHeader"
import { StatCard } from "@/components/data-display/StatCard"
import { ErrorState, LoadingState } from "@/components/feedback"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePatientDashboardQuery } from "@/features/dashboard/api/dashboard.hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { formatDateTime } from "@/lib/formatters/dateTime"

const severityRisk = { LOW: 20, MODERATE: 45, HIGH: 72, CRITICAL: 95 } as const

export function HealthAnalyticsPage(): React.JSX.Element {
  useDocumentTitle("Health analytics")
  const query = usePatientDashboardQuery()

  if (query.isLoading) return <LoadingState label="Building health analytics" />
  if (query.isError || !query.data) {
    return (
      <ErrorState
        description="Your longitudinal health analytics could not be loaded."
        onRetry={() => query.refetch()}
        title="Analytics unavailable"
      />
    )
  }

  const recent = query.data.summary.recent_predictions
  const riskTrend = [...recent].reverse().map((record) => ({
    label: new Date(record.created_at).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    }),
    risk: Math.round(
      severityRisk[record.top_candidate.severity] * 0.55 +
        record.top_candidate.probability * 45,
    ),
  }))
  const latestRisk = riskTrend.at(-1)?.risk ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild>
            <Link to="/predict">
              New assessment <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
        description="Explore assessment risk patterns, candidate distribution, and longitudinal activity."
        eyebrow="Longitudinal intelligence"
        title="Health analytics"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          context="derived from latest model result"
          icon={TrendingUp}
          label="Latest risk score"
          tone="rose"
          value={`${latestRisk}/100`}
        />
        <StatCard
          context="across all saved assessments"
          icon={Activity}
          label="Total assessments"
          tone="blue"
          value={query.data.summary.total_predictions.toString()}
        />
        <StatCard
          context="model consistency, not certainty"
          icon={BrainCircuit}
          label="Average confidence"
          tone="cyan"
          value={`${Math.round(query.data.summary.average_confidence * 100)}%`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard
          description="Composite score derived from severity and model probability."
          title="Risk trends"
        >
          <div className="h-72" role="img" aria-label="Assessment risk trend chart">
            <ResponsiveContainer>
              <AreaChart data={riskTrend}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#dce5f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area
                  dataKey="risk"
                  fill="url(#riskGradient)"
                  stroke="#2563eb"
                  strokeWidth={3}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          description="Frequency of leading disease candidates."
          title="Disease distribution"
        >
          <div className="h-72" role="img" aria-label="Disease distribution chart">
            <ResponsiveContainer>
              <BarChart data={query.data.frequency.items} layout="vertical">
                <CartesianGrid stroke="#dce5f0" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip />
                <Bar dataKey="percentage" fill="#2563eb" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent assessments</CardTitle>
          <Button asChild variant="ghost">
            <Link to="/assessments">View timeline</Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {recent.slice(0, 6).map((record) => (
            <Link
              className="rounded-xl border border-border/80 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
              key={record.id}
              to={`/reports/${record.id}`}
            >
              <p className="font-bold">{record.top_candidate.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(record.created_at)}
              </p>
              <p className="mt-3 text-sm font-semibold text-blue-700">
                {Math.round(record.top_candidate.probability * 100)}% probability
              </p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
