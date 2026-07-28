import { z } from "zod"

export const doctorDashboardSchema = z.object({
  assigned_patients: z.number().int().nonnegative(),
  new_patients_this_week: z.number().int().nonnegative(),
  pending_reviews: z.number().int().nonnegative(),
  due_today: z.number().int().nonnegative(),
  safety_alerts: z.number().int().nonnegative(),
  reviewed_today: z.number().int().nonnegative(),
  median_review_minutes: z.number().nonnegative(),
  review_activity: z.array(
    z.object({
      label: z.string().min(1),
      reviews: z.number().int().nonnegative(),
    }),
  ),
})

export const doctorPatientSchema = z.object({
  id: z.uuid(),
  display_name: z.string().min(1),
  age_years: z.number().int().min(0).max(130),
  latest_prediction: z.object({
    id: z.uuid(),
    top_candidate_name: z.string().min(1),
    confidence: z.number().min(0).max(1),
  }),
  priority: z.enum(["RED_FLAG", "REVIEW_TODAY", "ROUTINE"]),
  review_status: z.enum(["NEW", "URGENT", "REVIEWED"]),
})

export const doctorPatientsEnvelopeSchema = z.object({
  data: z.array(doctorPatientSchema),
  meta: z.object({
    request_id: z.string().min(1),
    next_cursor: z.string().nullable(),
    has_more: z.boolean(),
  }),
})
