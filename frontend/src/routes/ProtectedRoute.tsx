import { Navigate, Outlet, useLocation } from "react-router-dom"
import { LoadingState } from "@/components/feedback/LoadingState"
import { useAuth } from "@/state/auth/useAuth"
import type { UserRole } from "@/state/auth/auth.types"

export interface ProtectedRouteProps {
  allowedRoles?: readonly UserRole[]
  loginPath?: string
  requiredPermissions?: readonly string[]
}

export function ProtectedRoute({
  allowedRoles,
  loginPath = "/unauthorized?reason=authentication-required",
  requiredPermissions,
}: ProtectedRouteProps): React.JSX.Element {
  const { hasPermission, status, user } = useAuth()
  const location = useLocation()

  if (status === "initializing") {
    return <LoadingState label="Confirming your secure session" />
  }

  if (status === "unauthenticated" || !user) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    return (
      <Navigate
        replace
        state={{ returnTo }}
        to={loginPath}
      />
    )
  }

  const hasAllowedRole =
    !allowedRoles || allowedRoles.includes(user.role)
  const hasRequiredPermissions =
    !requiredPermissions ||
    requiredPermissions.every((permission) => hasPermission(permission))

  if (!hasAllowedRole || !hasRequiredPermissions) {
    return <Navigate replace to="/forbidden" />
  }

  return <Outlet />
}
