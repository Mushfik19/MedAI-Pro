import { createContext } from "react"
import type {
  AuthenticationStatus,
  AuthSession,
  AuthUser,
} from "@/state/auth/auth.types"

export interface AuthContextValue {
  status: AuthenticationStatus
  user: AuthUser | null
  establishSession: (session: AuthSession, accessToken: string) => void
  clearSession: () => void
  hasPermission: (permission: string) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)
