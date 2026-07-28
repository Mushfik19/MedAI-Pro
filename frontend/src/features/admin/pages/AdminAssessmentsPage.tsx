import { Search } from "lucide-react"
import { useDeferredValue, useState } from "react"
import { PageHeader } from "@/components/data-display/PageHeader"
import { ErrorState, LoadingState } from "@/components/feedback"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAdminAssessmentsQuery } from "@/features/admin/api/admin.hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { formatDateTime } from "@/lib/formatters/dateTime"
import { formatProbability } from "@/lib/formatters/probability"

export function AdminAssessmentsPage(): React.JSX.Element {
  useDocumentTitle("Assessment management")
  const [search, setSearch] = useState("")
  const query = useAdminAssessmentsQuery(useDeferredValue(search.trim()))
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Clinical governance" title="Assessment management"
        description="Review all persisted disease assessments and model outputs." />
      <label className="relative block max-w-xl">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search disease or user email" value={search}
          onChange={(event) => setSearch(event.target.value)} />
      </label>
      {query.isLoading ? <LoadingState label="Loading assessments" /> : null}
      {query.isError ? <ErrorState title="Assessments unavailable" description="Assessment records could not be loaded." onRetry={() => query.refetch()} /> : null}
      <div className="grid gap-3">
        {query.data?.map((item) => (
          <Card key={item.id} className="border-slate-200 shadow-sm">
            <CardContent className="grid gap-3 p-5 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div><p className="font-bold">{item.disease}</p>
                <p className="text-sm text-muted-foreground">{item.user_email} · {formatDateTime(item.created_at)}</p>
              </div>
              <div className="text-sm"><span className="font-bold">{formatProbability(item.confidence)}</span> confidence</div>
              <div className="flex gap-2"><Badge variant="secondary">{item.severity}</Badge>
                <Badge variant="outline">Model {item.model_version}</Badge></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
