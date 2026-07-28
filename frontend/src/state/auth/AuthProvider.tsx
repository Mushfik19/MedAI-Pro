import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react"
import { authService } from "@/features/auth/api/auth.service"
import {
  AuthContext,
  type AuthContextValue,
} from "@/state/auth/authContext"
import { authTokenStore } from "@/state/auth/authTokenStore"
import type { AuthSession } from "@/state/auth/auth.types"
import type { AuthenticationStatus } from "@/state/auth/auth.types"
import { subscribeToSessionExpired } from "@/state/auth/authSessionEvents"

export interface AuthProviderProps extends PropsWithChildren {
  initialSession?: AuthSession | null
  initialAccessToken?: string | null
}

export function AuthProvider({
  children,
  initialAccessToken = null,
  initialSession = null,
}: AuthProviderProps): React.JSX.Element {
  const shouldRestoreSession = initialSession === undefined
  const [session, setSession] = useState<AuthSession | null>(() => {
    if (initialAccessToken) {
      authTokenStore.setAccessToken(initialAccessToken)
    }
    return initialSession
  })
  const [status, setStatus] = useState<AuthenticationStatus>(
    shouldRestoreSession
      ? "initializing"
      : initialSession
        ? "authenticated"
        : "unauthenticated",
  )
  const hasStartedRestoration = useRef(false)

  useEffect(() => {
    if (!shouldRestoreSession || hasStartedRestoration.current) {
      return
    }

    hasStartedRestoration.current = true
    void authService
      .restoreSession()
      .then(({ accessToken, session: restoredSession }) => {
        authTokenStore.setAccessToken(accessToken)
        setSession(restoredSession)
        setStatus("authenticated")
      })
      .catch(() => {
        authTokenStore.clear()
        setSession(null)
        setStatus("unauthenticated")
      })
  }, [shouldRestoreSession])

  useEffect(
    () =>
      subscribeToSessionExpired(() => {
        authTokenStore.clear()
        setSession(null)
        setStatus("unauthenticated")
      }),
    [],
  )

  const establishSession = useCallback(
    (nextSession: AuthSession, accessToken: string): void => {
      authTokenStore.setAccessToken(accessToken)
      setSession(nextSession)
      setStatus("authenticated")
    },
    [],
  )

  const clearSession = useCallback((): void => {
    authTokenStore.clear()
    setSession(null)
    setStatus("unauthenticated")
  }, [])

  const permissionSet = useMemo(
    () => new Set(session?.user.permissions ?? []),
    [session],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      establishSession,
      clearSession,
      hasPermission: (permission: string) => permissionSet.has(permission),
    }),
    [clearSession, establishSession, permissionSet, session, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
