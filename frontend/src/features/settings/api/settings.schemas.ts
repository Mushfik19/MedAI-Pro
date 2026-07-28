import { z } from "zod"

export const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  notifications: z.object({
    clinical_alerts: z.boolean(),
    product_updates: z.boolean(),
    report_ready: z.boolean(),
    weekly_digest: z.boolean(),
  }),
  mfa_enabled: z.boolean(),
})

export const sessionSchema = z.object({
  id: z.uuid(),
  device_name: z.string().min(1),
  location_label: z.string().nullable(),
  last_seen_at: z.iso.datetime(),
  is_current: z.boolean(),
})

export const sessionsEnvelopeSchema = z.object({
  data: z.array(sessionSchema),
  meta: z.object({
    request_id: z.string().min(1),
  }),
})

export type Settings = z.infer<typeof settingsSchema>
