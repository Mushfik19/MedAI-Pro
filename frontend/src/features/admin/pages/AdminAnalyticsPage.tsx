import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import { ChartCard } from "@/components/charts/ChartCard"
import { PageHeader } from "@/components/data-display/PageHeader"
import { ErrorState, LoadingState } from "@/components/feedback"
import { useAdminAnalyticsQuery } from "@/features/admin/api/admin.hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"

export function AdminAnalyticsPage(): React.JSX.Element {
  useDocumentTitle("Platform analytics")
  const query = useAdminAnalyticsQuery()
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Platform intelligence" title="Analytics"
        description="Registration, disease, symptom, and assessment activity across the platform." />
      {query.isLoading ? <LoadingState label="Loading analytics" /> : null}
      {query.isError ? <ErrorState title="Analytics unavailable" description="Platform analytics could not be loaded." onRetry={() => query.refetch()} /> : null}
      {query.data ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {[
            ["Registrations", query.data.registrations, "date"],
            ["Assessment trends", query.data.assessment_trends, "date"],
          ].map(([title, data, key]) => (
            <ChartCard key={String(title)} title={String(title)} description="Last 30 days">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data as { date: string; count: number }[]}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey={String(key)} /><YAxis allowDecimals={false} /><Tooltip />
                  <Line dataKey="count" stroke="#2563eb" strokeWidth={3} type="monotone" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          ))}
          {[
            ["Disease distribution", query.data.disease_distribution],
            ["Symptom frequency", query.data.symptom_frequency],
          ].map(([title, data]) => (
            <ChartCard key={String(title)} title={String(title)} description="Most frequent clinical signals">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data as { name: string; count: number }[]} layout="vertical">
                  <CartesianGrid strokeDasharray="4 4" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" width={110} />
                  <Tooltip /><Bar dataKey="count" fill="#0891b2" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          ))}
        </div>
      ) : null}
    </div>
  )
}
