import { zodResolver } from "@hookform/resolvers/zod"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleCheck,
  BrainCircuit,
  Search,
  Sparkles,
  X,
} from "lucide-react"
import { useDeferredValue, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import { SeverityBadge } from "@/components/clinical/SeverityBadge"
import { PageHeader } from "@/components/data-display/PageHeader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useCreatePredictionMutation,
  useSymptomsQuery,
} from "@/features/predictions/api/prediction.hooks"
import type {
  Prediction,
  Symptom,
} from "@/features/predictions/domain/prediction.schemas"
import {
  calculateRiskScore,
  saveAssessmentReport,
} from "@/features/predictions/domain/assessmentReport"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils/cn"

interface SelectedSymptom {
  durationDays: number
  id: string
  intensity: number
  name: string
}

const assessmentFormSchema = z.object({
  symptoms: z
    .array(
      z.object({
        durationDays: z.number().int().min(1).max(365),
        id: z.uuid(),
        intensity: z.number().int().min(1).max(5),
        name: z.string().min(1),
      }),
    )
    .min(2, "Select at least two symptoms for a meaningful assessment."),
})

const commonSymptoms = new Set([
  "fever",
  "high_fever",
  "mild_fever",
  "cough",
  "headache",
  "fatigue",
  "nausea",
  "vomiting",
  "chills",
  "skin_rash",
  "joint_pain",
  "chest_pain",
  "breathlessness",
  "sore_throat",
  "diarrhoea",
  "abdominal_pain",
])

type AssessmentForm = z.infer<typeof assessmentFormSchema>

function estimateSeverity(symptoms: readonly SelectedSymptom[]): string {
  if (symptoms.length === 0) return "Not estimated"
  const peak = Math.max(...symptoms.map((symptom) => symptom.intensity))
  if (peak >= 5 || symptoms.length >= 6) return "High"
  if (peak >= 3 || symptoms.length >= 3) return "Moderate"
  return "Mild"
}

export function PredictionPage(): React.JSX.Element {
  useDocumentTitle("Disease prediction")
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [showMore, setShowMore] = useState(false)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const deferredQuery = useDeferredValue(query.trim())
  const symptomsQuery = useSymptomsQuery(deferredQuery)
  const predictionMutation = useCreatePredictionMutation()
  const form = useForm<AssessmentForm>({
    defaultValues: { symptoms: [] },
    resolver: zodResolver(assessmentFormSchema),
  })
  const selectedSymptoms = useWatch({ control: form.control, name: "symptoms" }) ?? []
  const selectedIds = useMemo(
    () => new Set(selectedSymptoms.map((symptom) => symptom.id)),
    [selectedSymptoms],
  )
  const suggestions = useMemo(() => {
    const available = (symptomsQuery.data ?? []).filter(
      (symptom) => !selectedIds.has(symptom.id),
    )
    const ordered = [...available].sort((left, right) => {
      const leftCommon = commonSymptoms.has(left.code)
      const rightCommon = commonSymptoms.has(right.code)
      if (leftCommon !== rightCommon) return leftCommon ? -1 : 1
      return left.name.localeCompare(right.name)
    })
    return deferredQuery || showMore ? ordered : ordered.slice(0, 18)
  }, [deferredQuery, selectedIds, showMore, symptomsQuery.data])
  const hiddenSuggestionCount = Math.max(
    0,
    (symptomsQuery.data?.length ?? 0) - selectedIds.size - suggestions.length,
  )
  const estimatedSeverity = estimateSeverity(selectedSymptoms)

  const setSelectedSymptoms = (symptoms: SelectedSymptom[]): void => {
    form.setValue("symptoms", symptoms, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const addSymptom = (symptom: Symptom): void => {
    if (selectedIds.has(symptom.id)) return
    setSelectedSymptoms([
      ...selectedSymptoms,
      { durationDays: 1, id: symptom.id, intensity: 3, name: symptom.name },
    ])
    setQuery("")
    setPrediction(null)
  }

  const removeSymptom = (id: string): void => {
    setSelectedSymptoms(selectedSymptoms.filter((symptom) => symptom.id !== id))
    setPrediction(null)
  }

  const updateSymptom = (
    id: string,
    changes: Partial<Pick<SelectedSymptom, "durationDays" | "intensity">>,
  ): void => {
    setSelectedSymptoms(
      selectedSymptoms.map((symptom) =>
        symptom.id === id ? { ...symptom, ...changes } : symptom,
      ),
    )
    setPrediction(null)
  }

  const submitAssessment = async ({ symptoms }: AssessmentForm): Promise<void> => {
    setIsAnalyzing(true)
    try {
      const [result] = await Promise.all([
        predictionMutation.mutateAsync({
          informed_use_accepted: true,
          symptoms: symptoms.map((symptom) => ({
            duration_days: symptom.durationDays,
            intensity: symptom.intensity,
            is_present: true,
            symptom_id: symptom.id,
          })),
        }),
        new Promise((resolve) => window.setTimeout(resolve, 600)),
      ])
      saveAssessmentReport({
        assessment: result,
        completedAt: new Date().toISOString(),
        overallRiskScore: calculateRiskScore(result),
        symptoms,
      })
      setPrediction(result)
      toast.success("Assessment completed using the active clinical model.")
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "The assessment could not be completed.",
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const startNewAssessment = (): void => {
    form.reset({ symptoms: [] })
    setPrediction(null)
    setQuery("")
    setShowMore(false)
  }

  const runAssessment = form.handleSubmit(submitAssessment, (errors) => {
    toast.error(errors.symptoms?.message ?? "Review the symptom details and try again.")
  })

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Badge className="gap-2 bg-blue-50 text-blue-700" variant="outline">
            <span className="size-2 rounded-full bg-emerald-500" />
            Clinical model ready
          </Badge>
        }
        description="Choose the symptoms you are experiencing. The model compares their pattern with 41 trained disease classes."
        eyebrow="AI symptom assessment"
        title="Understand your symptoms"
      />

      {isAnalyzing ? (
        <div
          aria-label="AI assessment in progress"
          aria-live="polite"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-md"
          role="status"
        >
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-7 text-center shadow-2xl">
            <div className="relative mx-auto grid size-20 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/25" />
              <span className="absolute inset-2 animate-pulse rounded-full bg-blue-100" />
              <BrainCircuit className="relative size-8 text-blue-600" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-extrabold tracking-[-0.03em] text-slate-950">
              Analyzing your symptoms
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              The clinical AI is comparing your symptom pattern, ranking probable
              conditions, and preparing a secure report.
            </p>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
            </div>
          </div>
        </div>
      ) : null}

      {prediction?.emergency.is_emergency ? (
        <Alert className="border-destructive/30 bg-destructive/5" variant="danger">
          <AlertTriangle className="size-5" />
          <AlertTitle>Potential emergency symptoms detected</AlertTitle>
          <AlertDescription>{prediction.emergency.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/70 bg-slate-50/70 dark:bg-slate-900/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl sm:text-2xl">Select symptoms</CardTitle>
                  <CardDescription className="mt-1">
                    Search the complete library or choose from common symptoms.
                  </CardDescription>
                </div>
                <Badge variant="secondary">{selectedSymptoms.length} selected</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-5 sm:pt-6">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-autocomplete="list"
                  aria-controls="symptom-suggestions"
                  aria-label="Search symptoms"
                  className="h-12 rounded-xl border-slate-300 bg-white pl-10 shadow-none"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Type a symptom, for example headache or skin rash"
                  value={query}
                />
              </div>

              <section aria-labelledby="selected-symptoms-heading">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold" id="selected-symptoms-heading">
                      Your symptoms
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Set intensity and duration for each selection.
                    </p>
                  </div>
                </div>
                {selectedSymptoms.length === 0 ? (
                  <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/40 px-5 text-center">
                    <p className="text-sm text-muted-foreground">
                      Select at least two symptoms from the suggestions below.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedSymptoms.map((symptom) => (
                      <article
                        className="rounded-xl border border-blue-200 bg-blue-50/45 p-3.5"
                        key={symptom.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              {symptom.name}
                            </h3>
                            <p className="mt-0.5 text-[0.6875rem] text-slate-500">
                              Intensity {symptom.intensity}/5 · {symptom.durationDays}{" "}
                              {symptom.durationDays === 1 ? "day" : "days"}
                            </p>
                          </div>
                          <button
                            aria-label={`Remove ${symptom.name}`}
                            className="grid size-7 place-items-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-900"
                            onClick={() => removeSymptom(symptom.id)}
                            type="button"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                        <div className="mt-3 grid grid-cols-[1fr_5.25rem] gap-3">
                          <div>
                            <Label className="sr-only">Intensity for {symptom.name}</Label>
                            <div className="grid grid-cols-5 gap-1">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <button
                                  aria-label={`Set ${symptom.name} intensity to ${level}`}
                                  className={cn(
                                    "h-7 rounded-md text-xs font-bold transition",
                                    symptom.intensity === level
                                      ? "bg-blue-600 text-white shadow-sm"
                                      : "border border-blue-200 bg-white text-slate-600 hover:border-blue-400",
                                  )}
                                  key={level}
                                  onClick={() =>
                                    updateSymptom(symptom.id, { intensity: level })
                                  }
                                  type="button"
                                >
                                  {level}
                                </button>
                              ))}
                            </div>
                          </div>
                          <Input
                            aria-label={`Duration in days for ${symptom.name}`}
                            className="h-7 rounded-md bg-white px-2 text-xs"
                            max={365}
                            min={1}
                            onChange={(event) =>
                              updateSymptom(symptom.id, {
                                durationDays: Math.min(
                                  365,
                                  Math.max(1, Number(event.target.value)),
                                ),
                              })
                            }
                            type="number"
                            value={symptom.durationDays}
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <Separator />

              <section aria-labelledby="suggestions-heading">
                <div className="mb-3">
                  <h2 className="text-sm font-bold" id="suggestions-heading">
                    {deferredQuery ? "Search results" : "Common symptoms"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Select a suggestion to add it to your assessment.
                  </p>
                </div>
                <div
                  aria-label="Symptom suggestions"
                  className="flex max-h-52 flex-wrap content-start gap-2 overflow-y-auto"
                  id="symptom-suggestions"
                  role="listbox"
                >
                  {symptomsQuery.isLoading ? (
                    <p className="py-3 text-sm text-muted-foreground">
                      Loading symptom library…
                    </p>
                  ) : null}
                  {symptomsQuery.isError ? (
                    <Button onClick={() => symptomsQuery.refetch()} size="sm" variant="outline">
                      Retry symptom library
                    </Button>
                  ) : null}
                  {suggestions.map((symptom) => (
                    <button
                      aria-selected="false"
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                      key={symptom.id}
                      onClick={() => addSymptom(symptom)}
                      role="option"
                      type="button"
                    >
                      <Check className="size-3 text-blue-500" />
                      {symptom.name}
                    </button>
                  ))}
                  {!symptomsQuery.isLoading && suggestions.length === 0 ? (
                    <p className="py-3 text-sm text-muted-foreground">
                      No matching symptoms found.
                    </p>
                  ) : null}
                </div>
                {!deferredQuery && hiddenSuggestionCount > 0 ? (
                  <Button
                    className="mt-3"
                    onClick={() => setShowMore(true)}
                    size="sm"
                    variant="ghost"
                  >
                    Show {hiddenSuggestionCount} more
                    <ChevronDown className="size-4" />
                  </Button>
                ) : null}
              </section>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-blue-200 xl:sticky xl:top-20">
          <div className="h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />
          <CardHeader>
            <CardTitle>Assessment summary</CardTitle>
            <CardDescription>Review your inputs before prediction.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-xs text-muted-foreground">Selected symptoms</dt>
                <dd className="text-sm font-bold">{selectedSymptoms.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-muted-foreground">Estimated severity</dt>
                <dd className="text-sm font-bold">{estimatedSeverity}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-muted-foreground">Model status</dt>
                <dd className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <CircleCheck className="size-3.5" /> Ready
                </dd>
              </div>
            </dl>
            <Separator />
            <Button
              className="h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-blue-600/15"
              loading={isAnalyzing}
              onClick={runAssessment}
              size="lg"
            >
              <Sparkles className="size-4" />
              Run AI assessment
            </Button>
            <p className="text-center text-[0.6875rem] leading-4 text-muted-foreground">
              Decision support only. Results are not a medical diagnosis.
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog onOpenChange={(open) => !open && setPrediction(null)} open={Boolean(prediction)}>
        <DialogContent className="max-w-2xl overflow-hidden rounded-3xl border-blue-100 p-0">
          {prediction ? (
            <>
              <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 px-6 py-7 text-white sm:px-8">
                <span className="grid size-12 place-items-center rounded-2xl bg-white/15">
                  <CircleCheck className="size-7" />
                </span>
                <DialogHeader className="mt-5">
                  <DialogTitle className="text-3xl font-extrabold tracking-[-0.04em] text-white">
                    Assessment completed
                  </DialogTitle>
                  <DialogDescription className="text-blue-50">
                    Your secure AI health report is ready to review.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="space-y-5 px-6 py-6 sm:px-8">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                    <p className="text-xs font-semibold text-slate-500">Risk score</p>
                    <p className="mt-1 text-2xl font-extrabold text-blue-700">
                      {calculateRiskScore(prediction)}
                      <span className="text-sm text-slate-400">/100</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                    <p className="text-xs font-semibold text-slate-500">Confidence</p>
                    <p className="mt-1 text-2xl font-extrabold text-blue-700">
                      {Math.round(prediction.confidence.score * 100)}%
                    </p>
                  </div>
                  <div className="col-span-2 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:col-span-1">
                    <p className="text-xs font-semibold text-slate-500">Severity</p>
                    <div className="mt-2">
                      {prediction.results[0] ? (
                        <SeverityBadge severity={prediction.results[0].severity} />
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/80 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                    Assessment summary
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {prediction.explanation ??
                      `The model identified ${prediction.results[0]?.disease.name} as the closest match for the selected symptom pattern.`}
                  </p>
                </div>
                <DialogFooter>
                  <Button onClick={startNewAssessment} variant="outline">
                    Start New Assessment
                  </Button>
                  <Button
                    onClick={() => navigate(`/reports/${prediction.id}`)}
                    size="lg"
                  >
                    View Full Report
                  </Button>
                </DialogFooter>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
