import { render, screen } from "@testing-library/react"
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { AuthProvider } from "@/state/auth/AuthProvider"
import type { AuthSession } from "@/state/auth/auth.types"

const patientSession: AuthSession = {
  user: {
    id: "1dded4ea-b559-44b2-bff7-91023a734f7e",
    email: "patient@example.com",
    displayName: "Patient",
    role: "PATIENT",
    permissions: ["prediction:read"],
  },
}

function LocationView(): React.JSX.Element {
  const location = useLocation()
  return <p>{`${location.pathname}${location.search}`}</p>
}

function renderProtectedRoute(
  session: AuthSession | null,
  requiredPermissions?: readonly string[],
  allowedRoles: readonly ("PATIENT" | "DOCTOR" | "ADMIN")[] = ["PATIENT"],
): void {
  render(
    <MemoryRouter initialEntries={["/protected?section=history"]}>
      <AuthProvider initialSession={session}>
        <Routes>
          <Route
            element={
              <ProtectedRoute
                allowedRoles={allowedRoles}
                {...(requiredPermissions ? { requiredPermissions } : {})}
              />
            }
          >
            <Route element={<p>Protected content</p>} path="/protected" />
          </Route>
          <Route element={<LocationView />} path="/unauthorized" />
          <Route element={<p>Forbidden</p>} path="/forbidden" />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users with a non-sensitive reason", async () => {
    renderProtectedRoute(null)

    expect(
      await screen.findByText(
        "/unauthorized?reason=authentication-required",
      ),
    ).toBeInTheDocument()
  })

  it("renders the route for an allowed role and permission", () => {
    renderProtectedRoute(patientSession, ["prediction:read"])

    expect(screen.getByText("Protected content")).toBeInTheDocument()
  })

  it("denies authenticated users missing a required permission", async () => {
    renderProtectedRoute(patientSession, ["prediction:write"])

    expect(await screen.findByText("Forbidden")).toBeInTheDocument()
  })

  it("denies a normal user access to administrator routes", async () => {
    renderProtectedRoute(patientSession, undefined, ["ADMIN"])

    expect(await screen.findByText("Forbidden")).toBeInTheDocument()
  })
})
