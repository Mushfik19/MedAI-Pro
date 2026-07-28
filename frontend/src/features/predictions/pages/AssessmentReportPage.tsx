import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Download,
  HeartPulse,
  Leaf,
  Printer,
  Share2,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Utensils,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ClinicalDisclaimer } from "@/components/clinical/ClinicalDisclaimer"
import { ProbabilityBar } from "@/components/clinical/ProbabilityBar"
import { SeverityBadge } from "@/components/clinical/SeverityBadge"
import { PageHeader } from "@/components/data-display/PageHeader"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  calculateRiskScore,
  getAssessmentReport,
  type AssessmentReport,
} from "@/features/predictions/domain/assessmentReport"
import { useAssessmentQuery } from "@/features/predictions/api/prediction.hooks"
import { predictionService } from "@/features/predictions/api/prediction.service"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { formatDateTime } from "@/lib/formatters/dateTime"

function InsightSection({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode
  icon: typeof Activity
  title: string
}): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="size-5" />
        </span>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  )
}

export function AssessmentReportPage(): React.JSX.Element {
  useDocumentTitle("Assessment report")
  const { assessmentId = "" } = useParams()
  const sessionReport = useMemo<AssessmentReport | null>(
    () => getAssessmentReport(assessmentId),
    [assessmentId],
  )
  const assessmentQuery = useAssessmentQuery(assessmentId, !sessionReport)
  const report = useMemo<AssessmentReport | null>(() => {
    if (sessionReport) return sessionReport
    if (!assessmentQuery.data) return null
    return {
      assessment: assessmentQuery.data.assessment,
      completedAt: assessmentQuery.data.assessment.created_at,
      overallRiskScore: calculateRiskScore(assessmentQuery.data.assessment),
      symptoms: assessmentQuery.data.selected_symptoms.map((symptom) => ({
        durationDays: 1,
        id: symptom.id,
        intensity: Math.max(1, Math.min(5, Math.round(symptom.intensity))),
        name: symptom.name,
      })),
    }
  }, [assessmentQuery.data, sessionReport])
  const [downloading, setDownloading] = useState(false)

  if (!report && assessmentQuery.isLoading) {
    return (
      <Card className="mx-auto max-w-xl animate-pulse p-8 text-center">
        <CardTitle>Loading persistent assessment report…</CardTitle>
      </Card>
    )
  }

  if (!report) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <CardHeader>
          <CardTitle>Report unavailable</CardTitle>
          <CardDescription>
            This secure report is no longer available in the current browser session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/predict">Start a new assessment</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { assessment } = report
  const primary = assessment.results[0]

  const downloadPdf = async (): Promise<void> => {
    setDownloading(true)
    try {
      const url = await predictionService.getReportDownload(assessment.id)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `mediai-assessment-${assessment.id}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success("PDF report downloaded.")
    } catch {
      toast.error("The PDF report could not be downloaded.")
    } finally {
      setDownloading(false)
    }
  }

  const shareReport = async (): Promise<void> => {
    const shareData = {
      title: "MediAI assessment report",
      text: `Assessment result: ${primary?.disease.name ?? "Clinical assessment"}`,
      url: window.location.href,
    }
    if (navigator.share) {
      await navigator.share(shareData)
      return
    }
    await navigator.clipboard.writeText(window.location.href)
    toast.success("Secure report link copied.")
  }

  return (
    <div className="space-y-5 print:bg-white">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button loading={downloading} onClick={downloadPdf} variant="outline">
              <Download className="size-4" /> Download PDF
            </Button>
            <Button onClick={() => window.print()} variant="outline">
              <Printer className="size-4" /> Print
            </Button>
            <Button onClick={shareReport}>
              <Share2 className="size-4" /> Share
            </Button>
          </div>
        }
        description={`Assessment ${assessment.id} · Completed ${formatDateTime(report.completedAt)}`}
        eyebrow="Confidential AI health report"
        title="Assessment report"
      />

      <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 text-white">
        <CardContent className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
              Primary predicted condition
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
              {primary?.disease.name}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50">
              {assessment.explanation ??
                "The selected symptom pattern most closely matches this trained disease class."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
              <p className="text-xs text-blue-100">Confidence</p>
              <p className="mt-1 text-3xl font-extrabold">
                {Math.round(assessment.confidence.score * 100)}%
              </p>
            </div>
            <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
              <p className="text-xs text-blue-100">Risk score</p>
              <p className="mt-1 text-3xl font-extrabold">{report.overallRiskScore}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Top 5 probable diseases</CardTitle>
                <CardDescription>Model-ranked differential possibilities.</CardDescription>
              </div>
              {primary ? <SeverityBadge severity={primary.severity} /> : null}
            </CardHeader>
            <CardContent className="space-y-3">
              {assessment.results.map((candidate) => (
                <div
                  className="rounded-xl border border-border/80 p-4"
                  key={candidate.rank}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-xs font-extrabold text-blue-700">
                        {candidate.rank}
                      </span>
                      <div>
                        <p className="text-sm font-bold">{candidate.disease.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {candidate.specialist.name}
                        </p>
                      </div>
                    </div>
                    <SeverityBadge severity={candidate.severity} />
                  </div>
                  <ProbabilityBar
                    label="Model probability"
                    probability={candidate.probability}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <InsightSection icon={Sparkles} title="AI explanation">
            {assessment.explanation ??
              "The model evaluated the combined pattern of selected symptoms and ranked the closest learned disease classes."}
          </InsightSection>

          <InsightSection icon={CalendarClock} title="Assessment timeline">
            <ol className="space-y-3">
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
                Symptoms recorded and validated
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
                AI model analysis completed
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
                Report generated at {formatDateTime(report.completedAt)}
              </li>
            </ol>
          </InsightSection>
        </div>

        <div className="space-y-5">
          <InsightSection icon={HeartPulse} title="Selected symptoms">
            <div className="flex flex-wrap gap-2">
              {report.symptoms.map((symptom) => (
                <span
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                  key={symptom.id}
                >
                  {symptom.name} · {symptom.intensity}/5
                </span>
              ))}
            </div>
          </InsightSection>

          <InsightSection icon={Stethoscope} title="Suggested specialist">
            {primary?.specialist.name ?? "Primary care physician"}
          </InsightSection>

          <InsightSection icon={Activity} title="Clinical summary">
            {assessment.explanation ??
              `The model identified ${primary?.disease.name} as the closest symptom-pattern match.`}
          </InsightSection>

          <InsightSection icon={ShieldAlert} title="Recommendations and precautions">
            <ul className="space-y-2">
              <li>Arrange a qualified clinical evaluation.</li>
              <li>Monitor symptoms and seek urgent care if they worsen.</li>
              <li>Do not begin treatment based only on this assessment.</li>
            </ul>
          </InsightSection>

          <InsightSection icon={Utensils} title="Diet advice">
            Prioritize hydration and balanced, easily tolerated meals. Follow
            condition-specific dietary advice only after consulting a clinician.
          </InsightSection>

          <InsightSection icon={Leaf} title="Recovery tips">
            Rest adequately, keep a symptom diary, follow professional medical advice,
            and avoid strenuous activity while symptoms are active.
          </InsightSection>

          <ClinicalDisclaimer />
        </div>
      </div>

      <div className="flex justify-end print:hidden">
        <Button asChild variant="outline">
          <Link to="/predict">Start another assessment</Link>
        </Button>
      </div>
      <Separator className="print:hidden" />
    </div>
  )
}
