import { z } from "zod"

export const userRoleSchema = z.enum(["PATIENT", "DOCTOR", "ADMIN"])

export const authUserSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
    display_name: z.string().min(1),
    role: userRoleSchema,
    permissions: z.array(z.string()),
  })
  .transform((user) => ({
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    permissions: user.permissions,
  }))

export const accessTokenSchema = z
  .object({
    access_token: z.string().min(1),
    token_type: z.literal("bearer"),
    expires_in: z.number().int().positive(),
    csrf_token: z.string().min(32),
  })
  .transform((result) => ({
    accessToken: result.access_token,
    expiresIn: result.expires_in,
    csrfToken: result.csrf_token,
  }))

export const loginResultSchema = z.object({
  status: z.literal("AUTHENTICATED"),
  access_token: z.string().min(1),
  token_type: z.literal("bearer"),
  expires_in: z.number().int().positive(),
  csrf_token: z.string().min(32),
})

export const registrationResultSchema = z.object({
  user_id: z.uuid(),
})
