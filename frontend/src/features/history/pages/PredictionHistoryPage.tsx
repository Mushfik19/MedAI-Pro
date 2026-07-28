import { Activity, Download, Filter, Search } from "lucide-react"
import { useDeferredValue, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ConfidenceBadge } from "@/components/clinical/ConfidenceBadge"
import { SeverityBadge } from "@/components/clinical/SeverityBadge"
import { PageHeader } from "@/components/data-display/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ErrorState, LoadingState } from "@/components/feedback"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  usePredictionHistoryExportMutation,
  usePredictionHistoryQuery,
} from "@/features/predictions/api/prediction.hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { ApiError } from "@/lib/api"
import { formatDateTime } from "@/lib/formatters/dateTime"
import { formatProbability } from "@/lib/formatters/probability"

export function PredictionHistoryPage(): React.JSX.Element {
  useDocumentTitle("Assessment history")
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query.trim())
  const [status, setStatus] = useState("all")
  const historyQuery = usePredictionHistoryQuery({
    query: deferredQuery,
    reviewStatus: status,
  })
  const exportMutation = usePredictionHistoryExportMutation()
  const records = historyQuery.data?.data ?? []

  const exportHistory = async (): Promise<void> => {
    try {
      const file = await exportMutation.mutateAsync()
      const url = URL.createObjectURL(file)
      const link = document.createElement("a")
      link.href = url
      link.download = `mediai-predictions-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success("Prediction history downloaded.")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to export prediction history.")
    }
  }

  return (
    <>
      <PageHeader
        actions={
          <Button
            loading={exportMutation.isPending}
            onClick={exportHistory}
            variant="outline"
          >
            <Download aria-hidden="true" />
            Export history
          </Button>
        }
        description="A chronological record of your persistent AI assessments and clinical reports."
        eyebrow="Longitudinal clinical record"
        title="Assessment history"
      />

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:p-5">
          <label className="relative">
            <span className="sr-only">Search prediction history</span>
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search candidate or symptom"
              value={query}
            />
          </label>
          <Select onValueChange={setStatus} value={status}>
            <SelectTrigger aria-label="Filter by review status">
              <Filter aria-hidden="true" className="mr-2 size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All review states</SelectItem>
              <SelectItem value="Reviewed">Reviewed</SelectItem>
              <SelectItem value="Pending review">Pending review</SelectItem>
              <SelectItem value="Patient only">Patient only</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {historyQuery.isLoading ? <LoadingState label="Loading prediction history" /> : null}
      {historyQuery.isError ? (
        <ErrorState
          title="Prediction history unavailable"
          description={
            historyQuery.error instanceof ApiError
              ? historyQuery.error.message
              : "The prediction history could not be loaded."
          }
          requestId={historyQuery.error instanceof ApiError ? historyQuery.error.requestId : undefined}
          onRetry={() => historyQuery.refetch()}
        />
      ) : null}

      {historyQuery.isSuccess ? (
      <div className="relative mt-6 space-y-4 before:absolute before:bottom-8 before:left-5 before:top-8 before:w-px before:bg-blue-200 sm:before:left-7">
        {records.map((record) => (
          <div className="relative pl-12 sm:pl-16" key={record.id}>
            <span className="absolute left-1 top-6 z-10 grid size-8 place-items-center rounded-full border-4 border-background bg-blue-600 text-white sm:left-3">
              <Activity className="size-3.5" />
            </span>
          <Card className="transition hover:border-blue-200 hover:shadow-md">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-bold">{record.top_candidate.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(record.created_at)}
                  </p>
                </div>
                <p className="font-display text-xl font-bold">
                  {formatProbability(record.top_candidate.probability)}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <SeverityBadge severity={record.top_candidate.severity} />
                <ConfidenceBadge confidence={record.confidence_band} />
                <Badge variant="outline">{record.review_status.replaceAll("_", " ")}</Badge>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {record.symptoms.join(" • ")}
              </p>
              <Button
                className="mt-5 w-full sm:w-auto"
                onClick={() => navigate(`/reports/${record.id}`)}
                variant="outline"
              >
                Open assessment report
              </Button>
            </CardContent>
          </Card>
          </div>
        ))}
      </div>
      ) : null}

      {historyQuery.isSuccess && records.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-border p-10 text-center">
          <p className="font-semibold">No predictions match these filters.</p>
          <Button
            className="mt-3"
            onClick={() => {
              setQuery("")
              setStatus("all")
            }}
            variant="link"
          >
            Clear filters
          </Button>
        </div>
      ) : null}
    </>
  )
}
