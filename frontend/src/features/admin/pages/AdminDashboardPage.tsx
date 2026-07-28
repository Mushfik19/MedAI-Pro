import { zodResolver } from "@hookform/resolvers/zod"
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileUp,
  MessageSquareText,
  Play,
  UserPlus,
  UsersRound,
} from "lucide-react"
import { useForm } from "react-hook-form"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"
import { z } from "zod"
import { ChartCard } from "@/components/charts/ChartCard"
import { PageHeader } from "@/components/data-display/PageHeader"
import { StatCard } from "@/components/data-display/StatCard"
import { ErrorState, LoadingState } from "@/components/feedback"
import { Form, FormTextField } from "@/components/forms"
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
  useAdminDashboardQuery,
  useStartTrainingMutation,
  useUploadDatasetMutation,
} from "@/features/admin/api/admin.hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { ApiError } from "@/lib/api"
import { formatDateTime } from "@/lib/formatters/dateTime"
import { getInitials } from "@/lib/formatters/name"

const datasetFormSchema = z.object({
  file: z
    .custom<File>((value) => value instanceof File, "Select a CSV or Parquet file.")
    .refine((file) => file.size <= 50 * 1024 * 1024, "File must not exceed 50 MB.")
    .refine(
      (file) =>
        [".csv", ".parquet"].some((extension) =>
          file.name.toLowerCase().endsWith(extension),
        ) &&
        [
          "",
          "text/csv",
          "application/csv",
          "application/vnd.apache.parquet",
          "application/octet-stream",
        ].includes(file.type),
      "Only CSV and Parquet datasets are accepted.",
    ),
  name: z.string().trim().min(8, "Use a descriptive dataset name.").max(120),
})
type DatasetForm = z.infer<typeof datasetFormSchema>

export function AdminDashboardPage(): React.JSX.Element {
  useDocumentTitle("Admin control center")
  const dashboardQuery = useAdminDashboardQuery()
  const uploadMutation = useUploadDatasetMutation()
  const trainingMutation = useStartTrainingMutation()
  const datasetForm = useForm<DatasetForm>({
    resolver: zodResolver(datasetFormSchema),
    defaultValues: { name: "" },
  })

  const uploadDataset = async (values: DatasetForm): Promise<void> => {
    try {
      await uploadMutation.mutateAsync(values)
      datasetForm.reset()
      toast.success("Dataset entered the quarantine and validation pipeline.")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Dataset upload failed.")
    }
  }

  const startTraining = async (): Promise<void> => {
    const dataset = dashboardQuery.data?.datasets.find(
      (candidate) => candidate.status === "VALID",
    )
    if (!dataset) {
      toast.error("A validated dataset is required before training can start.")
      return
    }
    try {
      await trainingMutation.mutateAsync(dataset.id)
      toast.success("Controlled model retraining job queued.")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to start retraining.")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Badge variant="success">
            <span className="size-1.5 rounded-full bg-current" />
            API connected
          </Badge>
        }
        description="Monitor users, model governance, dataset lineage, and operational health."
        eyebrow="Platform operations"
        title="Admin control center"
      />

      {dashboardQuery.isLoading ? <LoadingState label="Loading platform operations" /> : null}
      {dashboardQuery.isError ? (
        <ErrorState
          description={
            dashboardQuery.error instanceof ApiError
              ? dashboardQuery.error.message
              : "Administrative data could not be loaded."
          }
          onRetry={() => dashboardQuery.refetch()}
          requestId={
            dashboardQuery.error instanceof ApiError
              ? dashboardQuery.error.requestId
              : undefined
          }
          title="Admin control center unavailable"
        />
      ) : null}

      {dashboardQuery.data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              context="All platform identities"
              icon={UsersRound}
              label="Total users"
              tone="blue"
              value={dashboardQuery.data.analytics.total_users.toLocaleString()}
            />
            <StatCard
              context="Available for secure sign-in"
              icon={UsersRound}
              label="Active users"
              tone="green"
              value={dashboardQuery.data.analytics.active_users.toLocaleString()}
            />
            <StatCard
              context="Registered in the last 7 days"
              icon={UserPlus}
              label="New registrations"
              tone="cyan"
              value={dashboardQuery.data.analytics.new_registrations.toLocaleString()}
            />
            <StatCard
              context="Persistent clinical reports"
              icon={Activity}
              label="Total assessments"
              tone="cyan"
              value={dashboardQuery.data.analytics.total_assessments.toLocaleString()}
            />
            <StatCard
              context="All completed ML inferences"
              icon={Activity}
              label="Total predictions"
              tone="violet"
              value={dashboardQuery.data.analytics.total_predictions.toLocaleString()}
            />
            <StatCard
              context="Persisted AI interactions"
              icon={MessageSquareText}
              label="Total AI chats"
              tone="blue"
              value={dashboardQuery.data.analytics.total_ai_chats.toLocaleString()}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
            <div id="analytics">
              <ChartCard
                description="Validated recall and calibration quality over approved evaluations."
                title="Model performance"
              >
                <ResponsiveContainer height="100%" width="100%">
                  <LineChart data={dashboardQuery.data.analytics.model_performance}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                    <XAxis axisLine={false} dataKey="label" tickLine={false} />
                    <YAxis domain={[0, 1]} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      dataKey="top5_recall"
                      name="Top-5 recall"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      type="monotone"
                    />
                    <Line
                      dataKey="calibration_score"
                      name="Calibration"
                      stroke="#0891b2"
                      strokeWidth={2.5}
                      type="monotone"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <Card id="models">
              <CardHeader>
                <CardTitle>Production model</CardTitle>
                <CardDescription>Current approved and active artifact.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {dashboardQuery.data.models.find((model) => model.status === "ACTIVE") ? (
                  (() => {
                    const model = dashboardQuery.data.models.find(
                      (candidate) => candidate.status === "ACTIVE",
                    )!
                    return (
                      <div className="rounded-2xl border border-border/75 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-black">MediAI Ensemble {model.version}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {model.promoted_at
                                ? `Promoted ${formatDateTime(model.promoted_at)}`
                                : "Promotion timestamp unavailable"}
                            </p>
                          </div>
                          <Badge variant="success">Active</Badge>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                          <div className="rounded-xl bg-muted/45 p-3">
                            <p className="text-xl font-black">{model.macro_f1.toFixed(3)}</p>
                            <p className="text-xs text-muted-foreground">Macro F1</p>
                          </div>
                          <div className="rounded-xl bg-muted/45 p-3">
                            <p className="text-xl font-black">{model.p95_latency_ms} ms</p>
                            <p className="text-xs text-muted-foreground">P95 latency</p>
                          </div>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <p className="text-sm text-muted-foreground">No active model was returned.</p>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Play className="size-4" />
                      Start retraining job
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start controlled model retraining?</DialogTitle>
                      <DialogDescription>
                        The latest validated dataset will be used. Promotion still requires separate
                        validation and approval.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button loading={trainingMutation.isPending} onClick={startTraining}>
                          Queue training
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card id="users">
              <CardHeader>
                <CardTitle>Recent users</CardTitle>
                <CardDescription>Latest accounts returned by the admin API.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {dashboardQuery.data.users.map((user) => (
                  <div className="flex items-center justify-between gap-4 rounded-xl p-3" key={user.id}>
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                          {getInitials(user.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{user.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.role} · {formatDateTime(user.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={user.status === "ACTIVE" ? "success" : "warning"}>
                      {user.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card id="datasets">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Database className="size-5 text-primary" />
                  <div>
                    <CardTitle>Dataset registry</CardTitle>
                    <CardDescription>Quarantined and validated training sources.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardQuery.data.datasets.map((dataset) => (
                  <div className="rounded-2xl border border-border/75 p-4" key={dataset.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold">{dataset.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {dataset.row_count?.toLocaleString() ?? "Pending"} rows
                        </p>
                      </div>
                      {dataset.checksum_verified ? (
                        <CheckCircle2 className="size-5 text-success" />
                      ) : (
                        <AlertTriangle className="size-5 text-warning" />
                      )}
                    </div>
                  </div>
                ))}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <FileUp className="size-4" />
                      Upload dataset
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload a governed dataset</DialogTitle>
                      <DialogDescription>
                        CSV and Parquet files enter quarantine before validation or training.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...datasetForm}>
                      <form
                        className="space-y-4"
                        onSubmit={datasetForm.handleSubmit(uploadDataset)}
                      >
                        <FormTextField label="Dataset name" name="name" required />
                        <div className="space-y-2">
                          <label className="text-sm font-semibold" htmlFor="dataset-file">
                            Dataset file
                          </label>
                          <Input
                            accept=".csv,.parquet,text/csv,application/vnd.apache.parquet"
                            id="dataset-file"
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              if (file) {
                                datasetForm.setValue("file", file, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                            }}
                            type="file"
                          />
                          {datasetForm.formState.errors.file ? (
                            <p className="text-sm text-destructive">
                              {datasetForm.formState.errors.file.message}
                            </p>
                          ) : null}
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button loading={uploadMutation.isPending} type="submit">
                            Upload securely
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          <Card id="audit">
            <CardHeader>
              <CardTitle>Audit and governance activity</CardTitle>
              <CardDescription>Immutable privileged-action records.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {dashboardQuery.data.audit.map((event) => (
                <div className="rounded-2xl border border-border/75 p-4" key={event.id}>
                  <Activity className="size-5 text-primary" />
                  <p className="mt-3 font-semibold">{event.event_label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.actor_label} · {formatDateTime(event.occurred_at)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
