import { z } from "zod"

export const severitySchema = z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL"])
export const confidenceBandSchema = z.enum(["LOW", "MEDIUM", "HIGH"])

export type Severity = z.infer<typeof severitySchema>
export type Confidence = z.infer<typeof confidenceBandSchema>

export const symptomSchema = z.object({
  id: z.uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
})

const recommendedTestSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  priority: z.enum(["ROUTINE", "CONDITIONAL", "URGENT"]),
  rationale: z.string().min(1),
})

const predictionCandidateSchema = z.object({
  rank: z.number().int().min(1).max(5),
  disease: z.object({
    id: z.uuid(),
    code: z.string().min(1),
    name: z.string().min(1),
  }),
  probability: z.number().min(0).max(1),
  severity: severitySchema,
  supporting_symptoms: z.array(z.string()),
  missing_discriminative_symptoms: z.array(z.string()),
  recommended_tests: z.array(recommendedTestSchema),
  specialist: z.object({
    code: z.string().min(1),
    name: z.string().min(1),
  }),
})

export const predictionSchema = z.object({
  id: z.uuid(),
  status: z.enum(["COMPLETED", "EXPLANATION_PENDING", "EXPLANATION_FAILED"]),
  created_at: z.iso.datetime(),
  model: z.object({
    version: z.string().min(1),
    trained_at: z.iso.datetime(),
  }),
  confidence: z.object({
    score: z.number().min(0).max(1),
    band: confidenceBandSchema,
    label: z.string().min(1),
  }),
  emergency: z.object({
    is_emergency: z.boolean(),
    action_level: z.enum(["ROUTINE", "PROMPT", "URGENT", "EMERGENCY"]),
    message: z.string().nullable(),
    matched_rule_codes: z.array(z.string()),
  }),
  results: z.array(predictionCandidateSchema).min(1).max(5),
  explanation: z.string().nullable(),
  disclaimer: z.string().min(1),
})

export const predictionHistoryRecordSchema = z.object({
  id: z.uuid(),
  created_at: z.iso.datetime(),
  top_candidate: z.object({
    name: z.string().min(1),
    probability: z.number().min(0).max(1),
    severity: severitySchema,
  }),
  confidence_band: confidenceBandSchema,
  review_status: z.enum(["REVIEWED", "PENDING_REVIEW", "PATIENT_ONLY"]),
  symptoms: z.array(z.string()),
})

export const predictionHistorySchema = z.object({
  data: z.array(predictionHistoryRecordSchema),
  meta: z.object({
    request_id: z.string().min(1),
    next_cursor: z.string().nullable(),
    has_more: z.boolean(),
  }),
})

export const persistentAssessmentSchema = z.object({
  assessment: predictionSchema,
  selected_symptoms: z.array(
    z.object({
      id: z.uuid(),
      code: z.string().min(1),
      name: z.string().min(1),
      intensity: z.number().nonnegative(),
    }),
  ),
})

export type Prediction = z.infer<typeof predictionSchema>
export type Symptom = z.infer<typeof symptomSchema>
export type PredictionHistoryRecord = z.infer<typeof predictionHistoryRecordSchema>
