import { zodResolver } from "@hookform/resolvers/zod"
import { Bot, MessageSquarePlus, Send, ShieldCheck, UserRound } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { ClinicalDisclaimer } from "@/components/clinical/ClinicalDisclaimer"
import { PageHeader } from "@/components/data-display/PageHeader"
import { ErrorState, LoadingState } from "@/components/feedback"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  useConversationQuery,
  useConversationsQuery,
  useCreateConversationMutation,
  useSendMessageMutation,
} from "@/features/chat/api/chat.hooks"
import {
  chatMessageFormSchema,
  type ChatMessageForm,
} from "@/features/chat/api/chat.schemas"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { ApiError } from "@/lib/api"
import { formatDateTime } from "@/lib/formatters/dateTime"
import { cn } from "@/lib/utils/cn"

export function ChatPage(): React.JSX.Element {
  useDocumentTitle("AI health assistant")
  const conversationsQuery = useConversationsQuery()
  const createMutation = useCreateConversationMutation()
  const sendMutation = useSendMessageMutation()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const conversationQuery = useConversationQuery(selectedId)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const form = useForm<ChatMessageForm>({
    defaultValues: { content: "" },
    resolver: zodResolver(chatMessageFormSchema),
  })

  useEffect(() => {
    if (!selectedId && conversationsQuery.data?.[0]) {
      setSelectedId(conversationsQuery.data[0].id)
    }
  }, [conversationsQuery.data, selectedId])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversationQuery.data?.messages])

  const createConversation = async (): Promise<void> => {
    try {
      const conversation = await createMutation.mutateAsync()
      setSelectedId(conversation.id)
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to start a conversation.",
      )
    }
  }

  const sendMessage = async ({ content }: ChatMessageForm): Promise<void> => {
    if (!selectedId) {
      return
    }
    try {
      await sendMutation.mutateAsync({ content, conversationId: selectedId })
      form.reset()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to send your message.")
    }
  }

  if (conversationsQuery.isLoading) {
    return <LoadingState label="Loading conversations" />
  }

  if (conversationsQuery.isError) {
    return (
      <ErrorState
        description={
          conversationsQuery.error instanceof ApiError
            ? conversationsQuery.error.message
            : "Your conversations could not be loaded."
        }
        onRetry={() => conversationsQuery.refetch()}
        requestId={
          conversationsQuery.error instanceof ApiError
            ? conversationsQuery.error.requestId
            : undefined
        }
        title="AI Chat unavailable"
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Badge variant="success">
            <ShieldCheck className="size-3.5" />
            Safety guardrails active
          </Badge>
        }
        description="Ask questions about your assessment and prepare a practical conversation with your care team."
        eyebrow="Grounded health education"
        title="AI health assistant"
      />

      <div className="grid min-h-[680px] gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden space-y-4 lg:block">
          <Button
            className="w-full"
            loading={createMutation.isPending}
            onClick={createConversation}
          >
            <MessageSquarePlus className="size-4" />
            New conversation
          </Button>
          <Card className="p-3">
            <p className="px-2 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Conversations
            </p>
            {conversationsQuery.data?.map((conversation) => (
              <button
                className={cn(
                  "mt-1 w-full rounded-xl p-3 text-left transition hover:bg-muted",
                  selectedId === conversation.id && "bg-primary/10 text-primary",
                )}
                key={conversation.id}
                onClick={() => setSelectedId(conversation.id)}
                type="button"
              >
                <p className="truncate text-sm font-semibold">{conversation.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(conversation.updated_at)} · {conversation.message_count} messages
                </p>
              </button>
            ))}
          </Card>
          <ClinicalDisclaimer />
        </aside>

        <Card className="flex min-h-[680px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/75 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 border border-primary/20 bg-primary/10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="size-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold">MediAI Assistant</p>
                <p className="text-xs text-muted-foreground">
                  {conversationQuery.data?.prediction_id
                    ? "Grounded in a prediction report"
                    : "General health education"}
                </p>
              </div>
            </div>
            <Button
              className="lg:hidden"
              loading={createMutation.isPending}
              onClick={createConversation}
              size="icon"
              variant="outline"
            >
              <MessageSquarePlus className="size-4" />
              <span className="sr-only">New conversation</span>
            </Button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto bg-muted/15 px-4 py-6 sm:px-6">
            {conversationQuery.isLoading ? (
              <LoadingState label="Loading messages" />
            ) : null}
            {conversationQuery.isError ? (
              <ErrorState
                className="min-h-40"
                description="This conversation could not be loaded."
                onRetry={() => conversationQuery.refetch()}
                title="Messages unavailable"
              />
            ) : null}
            {!selectedId ? (
              <div className="grid min-h-96 place-items-center text-center">
                <div>
                  <Bot className="mx-auto size-10 text-primary" />
                  <h2 className="mt-4 text-xl font-bold">Start a secure conversation</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create a conversation to ask grounded health questions.
                  </p>
                  <Button className="mt-5" onClick={createConversation}>
                    New conversation
                  </Button>
                </div>
              </div>
            ) : null}
            <div className="mx-auto max-w-3xl space-y-6">
              {conversationQuery.data?.messages.map((message) => (
                <div
                  className={cn(
                    "flex gap-3",
                    message.role === "USER" && "flex-row-reverse",
                  )}
                  key={message.id}
                >
                  <Avatar className="mt-1 size-8 shrink-0">
                    <AvatarFallback
                      className={
                        message.role === "ASSISTANT"
                          ? "bg-primary/10 text-primary"
                          : "bg-foreground text-background"
                      }
                    >
                      {message.role === "ASSISTANT" ? (
                        <Bot className="size-4" />
                      ) : (
                        <UserRound className="size-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                      message.role === "ASSISTANT"
                        ? "rounded-tl-md border border-border/70 bg-card"
                        : "rounded-tr-md bg-primary text-primary-foreground",
                    )}
                  >
                    <p>{message.content}</p>
                    <p className="mt-2 text-right text-[11px] opacity-70">
                      {formatDateTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              {sendMutation.isPending ? <LoadingState className="min-h-16" label="Generating response" /> : null}
              <div ref={messageEndRef} />
            </div>
          </div>

          <form
            className="border-t border-border/75 bg-card p-4 sm:p-5"
            onSubmit={form.handleSubmit(sendMessage)}
          >
            <div className="mx-auto flex max-w-3xl items-end gap-2">
              <Textarea
                {...form.register("content")}
                aria-invalid={Boolean(form.formState.errors.content)}
                className="max-h-32 min-h-12 resize-none"
                disabled={!selectedId || sendMutation.isPending}
                maxLength={4000}
                placeholder="Ask about your assessment..."
                rows={1}
              />
              <Button
                className="size-12 shrink-0"
                disabled={!selectedId || sendMutation.isPending}
                size="icon"
                type="submit"
              >
                <Send className="size-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
            {form.formState.errors.content ? (
              <p className="mx-auto mt-2 max-w-3xl text-xs text-destructive">
                {form.formState.errors.content.message}
              </p>
            ) : null}
          </form>
        </Card>
      </div>
    </div>
  )
}
