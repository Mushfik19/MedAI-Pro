import { z } from "zod"

const applicationConfigSchema = z.object({
  apiBaseUrl: z.string().min(1),
  environment: z.enum(["local", "test", "staging", "production"]),
  enableApiLogging: z.boolean(),
  informedUseConsentId: z.uuid().optional(),
})

export type ApplicationConfig = z.infer<typeof applicationConfigSchema>

function toBoolean(value: string | undefined): boolean {
  return value === "true"
}

const defaultApiBaseUrl = import.meta.env.DEV
  ? "http://localhost:8000/api/v1"
  : "/api/v1"

export const applicationConfig: ApplicationConfig = applicationConfigSchema.parse({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl,
  environment: import.meta.env.VITE_APP_ENV ?? "local",
  enableApiLogging: toBoolean(import.meta.env.VITE_ENABLE_API_LOGGING),
  informedUseConsentId: import.meta.env.VITE_INFORMED_USE_CONSENT_ID || undefined,
})
