import type { Prediction } from "@/features/predictions/domain/prediction.schemas"

export interface ReportSymptom {
  durationDays: number
  id: string
  intensity: number
  name: string
}

export interface AssessmentReport {
  assessment: Prediction
  completedAt: string
  overallRiskScore: number
  symptoms: ReportSymptom[]
}

const storagePrefix = "mediai:assessment-report:"

export function calculateRiskScore(prediction: Prediction): number {
  const severityWeight = {
    LOW: 10,
    MODERATE: 35,
    HIGH: 65,
    CRITICAL: 90,
  }[prediction.results[0]?.severity ?? "MODERATE"]
  return Math.min(
    100,
    Math.round(prediction.confidence.score * 55 + severityWeight * 0.45),
  )
}

export function saveAssessmentReport(report: AssessmentReport): void {
  sessionStorage.setItem(
    `${storagePrefix}${report.assessment.id}`,
    JSON.stringify(report),
  )
}

export function getAssessmentReport(id: string): AssessmentReport | null {
  const serialized = sessionStorage.getItem(`${storagePrefix}${id}`)
  if (!serialized) return null
  try {
    return JSON.parse(serialized) as AssessmentReport
  } catch {
    return null
  }
}
