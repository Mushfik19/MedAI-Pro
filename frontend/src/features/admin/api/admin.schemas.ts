import { z } from "zod"

export const adminAnalyticsSchema = z.object({
  total_users: z.number().int().nonnegative(),
  active_users: z.number().int().nonnegative(),
  new_registrations: z.number().int().nonnegative(),
  total_assessments: z.number().int().nonnegative(),
  total_predictions: z.number().int().nonnegative(),
  total_ai_chats: z.number().int().nonnegative(),
  user_growth_rate: z.number(),
  predictions_today: z.number().int().nonnegative(),
  prediction_growth_rate: z.number(),
  model_top5_recall: z.number().min(0).max(1),
  open_incidents: z.number().int().nonnegative(),
  registrations: z.array(z.object({ date: z.string(), count: z.number().int() })),
  assessment_trends: z.array(z.object({ date: z.string(), count: z.number().int() })),
  disease_distribution: z.array(z.object({ name: z.string(), count: z.number().int() })),
  symptom_frequency: z.array(z.object({ name: z.string(), count: z.number().int() })),
  model_performance: z.array(
    z.object({
      label: z.string().min(1),
      top5_recall: z.number().min(0).max(1),
      calibration_score: z.number().min(0).max(1),
    }),
  ),
})

export const adminUserSchema = z.object({
  id: z.uuid(),
  username: z.string().nullable(),
  email: z.email(),
  display_name: z.string().min(1),
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]),
  status: z.enum(["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED", "DEACTIVATED"]),
  created_at: z.iso.datetime(),
  last_login_at: z.iso.datetime().nullable(),
})

export const adminAssessmentSchema = z.object({
  id: z.uuid(),
  user_email: z.string(),
  disease: z.string(),
  confidence: z.number(),
  severity: z.string(),
  model_version: z.string(),
  created_at: z.iso.datetime(),
})

export const adminChatSchema = z.object({
  id: z.uuid(),
  user_email: z.string(),
  prompt: z.string(),
  response: z.string(),
  model: z.string(),
  provider: z.string(),
  created_at: z.iso.datetime(),
})

const serviceStatusSchema = z.object({
  status: z.enum(["OPERATIONAL", "DEGRADED"]),
})

export const systemHealthSchema = z.object({
  api: serviceStatusSchema.extend({ version: z.string() }),
  database: serviceStatusSchema,
  redis: serviceStatusSchema,
  ml_model: serviceStatusSchema.extend({
    version: z.string().nullable(),
    trained_at: z.iso.datetime().nullable(),
  }),
})

export const adminModelSchema = z.object({
  id: z.uuid(),
  version: z.string().min(1),
  status: z.enum(["TRAINING", "VALIDATING", "APPROVED", "ACTIVE", "REJECTED"]),
  macro_f1: z.number().min(0).max(1),
  top5_recall: z.number().min(0).max(1),
  p95_latency_ms: z.number().nonnegative(),
  promoted_at: z.iso.datetime().nullable(),
})

export const adminDatasetSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  status: z.enum(["QUARANTINED", "VALIDATING", "VALID", "INVALID"]),
  row_count: z.number().int().nonnegative().nullable(),
  checksum_verified: z.boolean(),
  created_at: z.iso.datetime(),
})

export const auditEventSchema = z.object({
  id: z.uuid(),
  actor_label: z.string().min(1),
  event_label: z.string().min(1),
  occurred_at: z.iso.datetime(),
})

export const collectionEnvelope = <TSchema extends z.ZodType>(schema: TSchema) =>
  z.object({
    data: z.array(schema),
    meta: z.object({
      request_id: z.string().min(1),
      next_cursor: z.string().nullable().optional(),
      has_more: z.boolean().optional(),
    }),
  })
