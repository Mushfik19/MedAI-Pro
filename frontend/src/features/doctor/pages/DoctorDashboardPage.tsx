import { zodResolver } from "@hookform/resolvers/zod"
import {
  AlertTriangle,
  ClipboardCheck,
  Download,
  FileText,
  Search,
  Stethoscope,
  UsersRound,
} from "lucide-react"
import { useDeferredValue, useState } from "react"
import { useForm } from "react-hook-form"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"
import { ChartCard } from "@/components/charts/ChartCard"
import { PageHeader } from "@/components/data-display/PageHeader"
import { StatCard } from "@/components/data-display/StatCard"
import { ErrorState, LoadingState } from "@/components/feedback"
import { Form, FormTextareaField } from "@/components/forms"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  useCreateClinicalNoteMutation,
  useDoctorWorkspaceQuery,
  useQueueDoctorReportMutation,
} from "@/features/doctor/api/doctor.hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { ApiError } from "@/lib/api"
import { getInitials } from "@/lib/formatters/name"

const noteSchema = z.object({
  content: z.string().trim().min(20, "Document at least 20 characters.").max(10_000),
})
type NoteForm = z.infer<typeof noteSchema>

export function DoctorDashboardPage(): React.JSX.Element {
  useDocumentTitle("Doctor workspace")
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search.trim())
  const workspaceQuery = useDoctorWorkspaceQuery(deferredSearch)
  const noteMutation = useCreateClinicalNoteMutation()
  const reportMutation = useQueueDoctorReportMutation()
  const noteForm = useForm<NoteForm>({
    defaultValues: { content: "" },
    resolver: zodResolver(noteSchema),
  })

  const saveNote = async (
    predictionId: string,
    values: NoteForm,
  ): Promise<void> => {
    try {
      await noteMutation.mutateAsync({ content: values.content, predictionId })
      noteForm.reset()
      toast.success("Signed clinical note saved to the audit trail.")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to save the clinical note.")
    }
  }

  const queueReport = async (predictionId: string): Promise<void> => {
    try {
      await reportMutation.mutateAsync(predictionId)
      toast.success("Clinical PDF report queued.")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to queue the report.")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Review model-assisted assessments, prioritize safety signals, and document independent clinical judgment."
        eyebrow="Clinical workspace"
        title="Doctor dashboard"
      />

      {workspaceQuery.isLoading ? <LoadingState label="Loading clinical workspace" /> : null}
      {workspaceQuery.isError ? (
        <ErrorState
          description={
            workspaceQuery.error instanceof ApiError
              ? workspaceQuery.error.message
              : "The clinical workspace could not be loaded."
          }
          onRetry={() => workspaceQuery.refetch()}
          requestId={
            workspaceQuery.error instanceof ApiError
              ? workspaceQuery.error.requestId
              : undefined
          }
          title="Clinical workspace unavailable"
        />
      ) : null}

      {workspaceQuery.data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              context={`${workspaceQuery.data.dashboard.new_patients_this_week} new this week`}
              icon={UsersRound}
              label="Assigned patients"
              tone="blue"
              value={workspaceQuery.data.dashboard.assigned_patients.toLocaleString()}
            />
            <StatCard
              context={`${workspaceQuery.data.dashboard.due_today} due today`}
              icon={ClipboardCheck}
              label="Pending reviews"
              tone="cyan"
              value={workspaceQuery.data.dashboard.pending_reviews.toLocaleString()}
            />
            <StatCard
              context="Require attention"
              icon={AlertTriangle}
              label="Safety alerts"
              tone="rose"
              value={workspaceQuery.data.dashboard.safety_alerts.toLocaleString()}
            />
            <StatCard
              context={`Median ${workspaceQuery.data.dashboard.median_review_minutes}m`}
              icon={Stethoscope}
              label="Reviewed today"
              tone="green"
              value={workspaceQuery.data.dashboard.reviewed_today.toLocaleString()}
            />
          </div>

          <ChartCard
            description="Completed assessment reviews over the current reporting period."
            title="Clinical review activity"
          >
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={workspaceQuery.data.dashboard.review_activity}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis axisLine={false} dataKey="label" tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area
                  dataKey="reviews"
                  fill="var(--primary)"
                  fillOpacity={0.14}
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <Card id="patients">
            <CardHeader>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <CardTitle>Patient assessment queue</CardTitle>
                  <CardDescription>
                    Results are limited to patients with an active access grant.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label="Search patients"
                    className="pl-9"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search patient or report..."
                    value={search}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-3">Patient</th>
                    <th className="px-3 py-3">Latest candidate</th>
                    <th className="px-3 py-3">Confidence</th>
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workspaceQuery.data.patients.map((patient) => (
                    <tr className="border-b border-border/60 last:border-0" key={patient.id}>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                              {getInitials(patient.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{patient.display_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {patient.age_years} years
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">{patient.latest_prediction.top_candidate_name}</td>
                      <td className="px-3 py-4">
                        {Math.round(patient.latest_prediction.confidence * 100)}%
                      </td>
                      <td className="px-3 py-4">
                        <Badge
                          variant={
                            patient.priority === "RED_FLAG"
                              ? "danger"
                              : patient.priority === "REVIEW_TODAY"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {patient.priority.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <FileText className="size-4" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Clinical review · {patient.display_name}</DialogTitle>
                                <DialogDescription>
                                  This note is signed and immutable after submission.
                                </DialogDescription>
                              </DialogHeader>
                              <Form {...noteForm}>
                                <form
                                  className="space-y-4"
                                  onSubmit={noteForm.handleSubmit((values) =>
                                    saveNote(patient.latest_prediction.id, values),
                                  )}
                                >
                                  <FormTextareaField
                                    label="Clinical and prescription notes"
                                    name="content"
                                    required
                                    rows={7}
                                  />
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button type="button" variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button loading={noteMutation.isPending} type="submit">
                                      Sign and save
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                          <Button
                            aria-label={`Export ${patient.display_name}'s report`}
                            loading={reportMutation.isPending}
                            onClick={() => queueReport(patient.latest_prediction.id)}
                            size="icon"
                            variant="ghost"
                          >
                            <Download className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
