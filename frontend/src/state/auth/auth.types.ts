export const userRoles = ["PATIENT", "DOCTOR", "ADMIN"] as const
export type UserRole = (typeof userRoles)[number]

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role: UserRole
  permissions: readonly string[]
}

export interface AuthSession {
  user: AuthUser
}

export type AuthenticationStatus =
  | "initializing"
  | "authenticated"
  | "unauthenticated"
