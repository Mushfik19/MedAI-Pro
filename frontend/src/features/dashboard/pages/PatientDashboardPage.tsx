import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  ChartNoAxesCombined,
  FileClock,
  MessageCircle,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Link } from "react-router-dom"
import { ChartCard } from "@/components/charts/ChartCard"
import { ConfidenceBadge } from "@/components/clinical/ConfidenceBadge"
import { SeverityBadge } from "@/components/clinical/SeverityBadge"
import { PageHeader } from "@/components/data-display/PageHeader"
import { StatCard } from "@/components/data-display/StatCard"
import { ErrorState, LoadingState } from "@/components/feedback"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { usePatientDashboardQuery } from "@/features/dashboard/api/dashboard.hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { ApiError } from "@/lib/api"
import { formatDateTime } from "@/lib/formatters/dateTime"
import { formatProbability } from "@/lib/formatters/probability"
import { useAuth } from "@/state/auth/useAuth"

const chartColors = ["#2563eb", "#0891b2", "#7c3aed", "#0f766e", "#b45309"]

export function PatientDashboardPage(): React.JSX.Element {
  useDocumentTitle("Dashboard")
  const { user } = useAuth()
  const dashboardQuery = usePatientDashboardQuery()
  const firstName = user?.displayName.split(" ")[0] ?? "there"

  return (
    <>
      <PageHeader
        actions={
          <Button asChild>
            <Link to="/predict">
              New prediction
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
        description="Track prediction activity and review recent model results."
        eyebrow="Patient workspace"
        title={`Good afternoon, ${firstName}.`}
      />

      {dashboardQuery.isLoading ? <LoadingState label="Loading your dashboard" /> : null}
      {dashboardQuery.isError ? (
        <ErrorState
          description={
            dashboardQuery.error instanceof ApiError
              ? dashboardQuery.error.message
              : "Your dashboard could not be loaded."
          }
          onRetry={() => dashboardQuery.refetch()}
          requestId={
            dashboardQuery.error instanceof ApiError
              ? dashboardQuery.error.requestId
              : undefined
          }
          title="Dashboard unavailable"
        />
      ) : null}

      {dashboardQuery.data ? (
        <>
          {dashboardQuery.data.summary.recent_predictions[0] ? (
            <Card className="mb-5 overflow-hidden border-blue-200 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 text-white">
              <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
                    Latest assessment
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">
                    {
                      dashboardQuery.data.summary.recent_predictions[0].top_candidate
                        .name
                    }
                  </h2>
                  <p className="mt-2 text-sm text-blue-50">
                    {formatDateTime(
                      dashboardQuery.data.summary.recent_predictions[0].created_at,
                    )}{" "}
                    ·{" "}
                    {formatProbability(
                      dashboardQuery.data.summary.recent_predictions[0].top_candidate
                        .probability,
                    )}{" "}
                    model probability
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    asChild
                    className="bg-white text-blue-700 hover:bg-blue-50"
                  >
                    <Link
                      to={`/reports/${dashboardQuery.data.summary.recent_predictions[0].id}`}
                    >
                      Open report
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                    variant="outline"
                  >
                    <Link to="/chat">
                      <MessageCircle className="size-4" /> Ask AI
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                    variant="outline"
                  >
                    <Link to="/analytics">
                      <ChartNoAxesCombined className="size-4" /> Analytics
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              context="across prediction history"
              icon={FileClock}
              label="Total predictions"
              tone="blue"
              trend={{
                direction:
                  dashboardQuery.data.summary.monthly_prediction_delta >= 0 ? "up" : "down",
                value: `${Math.abs(
                  dashboardQuery.data.summary.monthly_prediction_delta,
                )} this month`,
              }}
              value={dashboardQuery.data.summary.total_predictions.toLocaleString()}
            />
            <StatCard
              context="not clinical certainty"
              icon={BrainCircuit}
              label="Average confidence"
              tone="cyan"
              trend={{
                direction:
                  dashboardQuery.data.summary.confidence_delta >= 0 ? "up" : "down",
                value: `${Math.abs(
                  dashboardQuery.data.summary.confidence_delta * 100,
                ).toFixed(1)}%`,
              }}
              value={formatProbability(
                dashboardQuery.data.summary.average_confidence,
              )}
            />
            <StatCard
              context="in the last 30 days"
              icon={Activity}
              label="Recent activity"
              tone="violet"
              value={dashboardQuery.data.summary.recent_activity_count.toLocaleString()}
            />
            <StatCard
              context="review urgent guidance"
              icon={AlertTriangle}
              label="Red-flag records"
              tone="rose"
              value={dashboardQuery.data.summary.red_flag_count.toLocaleString()}
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <ChartCard
              description="Prediction count during the current week."
              title="Weekly prediction activity"
            >
              <div
                aria-label="Area chart of weekly prediction activity"
                className="h-72 w-full"
                role="img"
              >
                <ResponsiveContainer>
                  <AreaChart data={dashboardQuery.data.trend.points}>
                    <defs>
                      <linearGradient id="predictionArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.32} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#cbd5e1" strokeDasharray="3 3" vertical={false} />
                    <XAxis axisLine={false} dataKey="label" tickLine={false} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} />
                    <Tooltip />
                    <Area
                      dataKey="predictions"
                      fill="url(#predictionArea)"
                      stroke="#2563eb"
                      strokeWidth={3}
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              description="Frequency among predicted candidates, not confirmed diagnoses."
              title="Candidate frequency"
            >
              <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto] xl:grid-cols-1 2xl:grid-cols-[1fr_auto]">
                <div
                  aria-label="Donut chart of candidate frequency"
                  className="h-56"
                  role="img"
                >
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={dashboardQuery.data.frequency.items}
                        dataKey="percentage"
                        innerRadius={58}
                        nameKey="name"
                        outerRadius={86}
                        paddingAngle={3}
                      >
                        {dashboardQuery.data.frequency.items.map((entry, index) => (
                          <Cell
                            fill={chartColors[index % chartColors.length] ?? "#2563eb"}
                            key={entry.disease_id}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-2 text-xs">
                  {dashboardQuery.data.frequency.items.map((item, index) => (
                    <li className="flex items-center gap-2" key={item.disease_id}>
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            chartColors[index % chartColors.length] ?? "#2563eb",
                        }}
                      />
                      <span className="flex-1 text-muted-foreground">{item.name}</span>
                      <span className="font-semibold">{item.percentage}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ChartCard>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Recent predictions</CardTitle>
                  <CardDescription className="mt-1">
                    Immutable result snapshots.
                  </CardDescription>
                </div>
                <Button asChild variant="ghost">
                  <Link to="/assessments">View all</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardQuery.data.summary.recent_predictions.slice(0, 3).map((record) => (
                  <Link
                    className="grid gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted sm:grid-cols-[1fr_auto] sm:items-center"
                    key={record.id}
                    to={`/reports/${record.id}`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{record.top_candidate.name}</p>
                        <SeverityBadge severity={record.top_candidate.severity} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(record.created_at)} • {record.id}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <ConfidenceBadge confidence={record.confidence_band} />
                      <span className="font-display text-xl font-bold">
                        {formatProbability(record.top_candidate.probability)}
                      </span>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="overflow-hidden bg-gradient-to-br from-blue-700 to-cyan-700 text-white">
              <CardHeader>
                <div className="flex size-11 items-center justify-center rounded-lg bg-white/15">
                  <CalendarDays aria-hidden="true" className="size-5" />
                </div>
                <CardTitle className="mt-4 text-white">
                  Weekly report {dashboardQuery.data.weeklyReport.status.toLowerCase()}
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Your summary covers {dashboardQuery.data.weeklyReport.prediction_count} predictions
                  and {dashboardQuery.data.weeklyReport.doctor_review_count} doctor reviews.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge className="bg-white/15 text-white" variant="outline">
                  {dashboardQuery.data.weeklyReport.period_label}
                </Badge>
                <Button
                  asChild
                  className="mt-6 w-full bg-white text-blue-800 hover:bg-blue-50"
                >
                  <Link to="/predictions">Review summary</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </>
  )
}
