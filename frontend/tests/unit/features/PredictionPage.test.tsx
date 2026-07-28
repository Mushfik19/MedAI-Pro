import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { predictionService } from "@/features/predictions/api/prediction.service"
import type { Prediction } from "@/features/predictions/domain/prediction.schemas"
import { PredictionPage } from "@/features/predictions/pages/PredictionPage"

const predictionResponse: Prediction = {
  id: "7cc36bb4-dc73-4a82-afc0-8a30ce28ad72",
  status: "COMPLETED",
  created_at: "2026-07-26T14:12:45Z",
  model: { version: "1.0.0", trained_at: "2026-07-20T09:00:00Z" },
  confidence: { score: 0.81, band: "HIGH", label: "High model consistency." },
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
    supporting_symptoms: ["Fever"],
    missing_discriminative_symptoms: [],
    recommended_tests: [
      {
        code: `TEST_${index + 1}`,
        name: "Clinical laboratory test",
        priority: "CONDITIONAL",
        rationale: "Confirmation may change management.",
      },
    ],
    specialist: { code: "PRIMARY_CARE", name: "Primary care physician" },
  })),
  explanation: "The symptom pattern is most consistent with the leading candidate.",
  disclaimer: "This result is not a diagnosis.",
}

describe("PredictionPage", () => {
  it("submits selected symptom IDs and presents validated ranked candidates", async () => {
    const user = userEvent.setup()
    window.scrollTo = vi.fn()
    vi.spyOn(predictionService, "listSymptoms").mockResolvedValue([
      {
        id: "991178b6-91c9-4e35-9bc3-d90fe327faca",
        code: "FEVER",
        name: "Fever",
        category: "GENERAL",
      },
      {
        id: "3c3d4dd5-1be2-4726-a9c5-f6dcb4042935",
        code: "DRY_COUGH",
        name: "Dry cough",
        category: "RESPIRATORY",
      },
    ])
    const createSpy = vi
      .spyOn(predictionService, "create")
      .mockResolvedValue(predictionResponse)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PredictionPage />
        </QueryClientProvider>
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole("option", { name: "Fever" }))
    await user.click(screen.getByRole("option", { name: "Dry cough" }))
    await user.click(screen.getByRole("button", { name: /Run AI assessment/i }))

    expect(
      await screen.findByRole("heading", { name: "Assessment completed" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Risk score")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "View Full Report" })).toBeInTheDocument()
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        informed_use_accepted: true,
        symptoms: expect.arrayContaining([
          expect.objectContaining({
            symptom_id: "991178b6-91c9-4e35-9bc3-d90fe327faca",
          }),
        ]),
      }),
      expect.anything(),
    )

    await user.click(screen.getByRole("button", { name: "Start New Assessment" }))
    expect(screen.getByText("0 selected")).toBeInTheDocument()
  })
})
