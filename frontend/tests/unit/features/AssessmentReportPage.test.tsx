import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import {
  saveAssessmentReport,
  type AssessmentReport,
} from "@/features/predictions/domain/assessmentReport"
import { AssessmentReportPage } from "@/features/predictions/pages/AssessmentReportPage"

const assessmentId = "7cc36bb4-dc73-4a82-afc0-8a30ce28ad72"

describe("AssessmentReportPage", () => {
  it("renders the persisted full clinical report", () => {
    const report: AssessmentReport = {
      assessment: {
        id: assessmentId,
        status: "COMPLETED",
        created_at: "2026-07-26T14:12:45Z",
        model: { version: "1.0.0", trained_at: "2026-07-20T09:00:00Z" },
        confidence: { score: 0.81, band: "HIGH", label: "High confidence" },
        emergency: {
          is_emergency: false,
          action_level: "ROUTINE",
          message: null,
          matched_rule_codes: [],
        },
        results: Array.from({ length: 5 }, (_, index) => ({
          rank: index + 1,
          disease: {
            id: `d12a2ef6-5351-4ee6-970c-7bfe41465a${index}6`,
            code: `CONDITION_${index + 1}`,
            name: index === 0 ? "Influenza" : `Condition ${index + 1}`,
          },
          probability: 0.8 - index * 0.1,
          severity: "MODERATE",
          supporting_symptoms: [],
          missing_discriminative_symptoms: [],
          recommended_tests: [],
          specialist: { code: "PRIMARY_CARE", name: "Primary care physician" },
        })),
        explanation: "The symptom pattern matches the leading candidate.",
        disclaimer: "This result is not a diagnosis.",
      },
      completedAt: "2026-07-26T14:12:46Z",
      overallRiskScore: 61,
      symptoms: [
        {
          durationDays: 2,
          id: "991178b6-91c9-4e35-9bc3-d90fe327faca",
          intensity: 4,
          name: "Fever",
        },
      ],
    }
    saveAssessmentReport(report)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/reports/${assessmentId}`]}>
          <Routes>
            <Route path="/reports/:assessmentId" element={<AssessmentReportPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByRole("heading", { name: "Assessment report" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Influenza" })).toBeInTheDocument()
    expect(screen.getByText("Selected symptoms")).toBeInTheDocument()
    expect(screen.getByText("Top 5 probable diseases")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Download PDF/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Print/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Share/i })).toBeInTheDocument()
  })
})
