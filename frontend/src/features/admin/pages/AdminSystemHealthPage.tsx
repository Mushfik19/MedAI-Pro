import { BrainCircuit, Database, Server, Waypoints } from "lucide-react"
import { PageHeader } from "@/components/data-display/PageHeader"
import { ErrorState, LoadingState } from "@/components/feedback"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useAdminSystemHealthQuery } from "@/features/admin/api/admin.hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"

export function AdminSystemHealthPage(): React.JSX.Element {
  useDocumentTitle("System health")
  const query = useAdminSystemHealthQuery()
  const services = query.data ? [
    ["API", query.data.api.status, `Version ${query.data.api.version}`, Server],
    ["Database", query.data.database.status, "Primary persistence", Database],
    ["Redis", query.data.redis.status, "Cache and task coordination", Waypoints],
    ["ML model", query.data.ml_model.status, query.data.ml_model.version ?? "No model loaded", BrainCircuit],
  ] as const : []
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Reliability" title="System health"
        description="Live API, database, Redis, and model readiness. Refreshes every 30 seconds." />
      {query.isLoading ? <LoadingState label="Checking platform health" /> : null}
      {query.isError ? <ErrorState title="Health checks unavailable" description="Live platform health could not be checked." onRetry={() => query.refetch()} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {services.map(([name, status, detail, Icon]) => (
          <Card key={name} className="border-slate-200 shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-2xl bg-slate-900 p-3 text-white"><Icon /></div>
              <div className="flex-1"><p className="text-lg font-black">{name}</p><p className="text-sm text-muted-foreground">{detail}</p></div>
              <Badge variant={status === "OPERATIONAL" ? "success" : "warning"}>{status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
