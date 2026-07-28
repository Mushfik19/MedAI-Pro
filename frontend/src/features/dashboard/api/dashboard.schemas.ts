import { z } from "zod"
import { predictionHistoryRecordSchema } from "@/features/predictions/domain/prediction.schemas"

export const dashboardSummarySchema = z.object({
  total_predictions: z.number().int().nonnegative(),
  average_confidence: z.number().min(0).max(1),
  recent_activity_count: z.number().int().nonnegative(),
  red_flag_count: z.number().int().nonnegative(),
  monthly_prediction_delta: z.number().int(),
  confidence_delta: z.number(),
  recent_predictions: z.array(predictionHistoryRecordSchema).max(10),
})

export const dashboardTrendSchema = z.object({
  generated_at: z.iso.datetime(),
  points: z.array(
    z.object({
      label: z.string().min(1),
      predictions: z.number().int().nonnegative(),
      confidence: z.number().min(0).max(1),
    }),
  ),
})

export const diseaseFrequencySchema = z.object({
  generated_at: z.iso.datetime(),
  items: z.array(
    z.object({
      disease_id: z.uuid(),
      name: z.string().min(1),
      percentage: z.number().min(0).max(100),
    }),
  ),
})

export const weeklyReportSchema = z.object({
  period_label: z.string().min(1),
  prediction_count: z.number().int().nonnegative(),
  doctor_review_count: z.number().int().nonnegative(),
  report_id: z.uuid().nullable(),
  status: z.enum(["READY", "GENERATING", "UNAVAILABLE"]),
})
