import { Bot, MessageSquareText } from "lucide-react"
import { PageHeader } from "@/components/data-display/PageHeader"
import { ErrorState, LoadingState } from "@/components/feedback"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useAdminChatsQuery } from "@/features/admin/api/admin.hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { formatDateTime } from "@/lib/formatters/dateTime"

export function AdminChatsPage(): React.JSX.Element {
  useDocumentTitle("AI chat monitoring")
  const query = useAdminChatsQuery()
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Responsible AI operations" title="AI chat monitoring"
        description="Review bounded conversation logs for safety and operational oversight." />
      {query.isLoading ? <LoadingState label="Loading AI conversations" /> : null}
      {query.isError ? <ErrorState title="Chat logs unavailable" description="AI conversation logs could not be loaded." onRetry={() => query.refetch()} /> : null}
      <div className="grid gap-4">
        {query.data?.map((chat) => (
          <Card key={chat.id} className="border-slate-200 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap justify-between gap-3 text-sm">
                <span className="font-semibold">{chat.user_email}</span>
                <span className="text-muted-foreground">{formatDateTime(chat.created_at)}</span>
              </div>
              <div className="rounded-xl bg-slate-100 p-4 text-sm"><MessageSquareText className="mb-2 size-4 text-blue-700" />{chat.prompt}</div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm"><Bot className="mb-2 size-4 text-blue-700" />{chat.response}</div>
              <Badge variant="outline">{chat.provider} / {chat.model}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
