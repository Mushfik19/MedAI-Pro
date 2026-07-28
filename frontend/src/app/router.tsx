import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { PublicLayout } from "@/components/layout/PublicLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import {
  AdminLayout,
  DoctorLayout,
  PatientLayout,
} from "@/routes/layouts/RoleLayouts"
import { ForbiddenPage } from "@/routes/system/ForbiddenPage"
import { NotFoundPage } from "@/routes/system/NotFoundPage"
import { ServiceUnavailablePage } from "@/routes/system/ServiceUnavailablePage"
import { SystemErrorPage } from "@/routes/system/SystemErrorPage"
import { UnauthorizedPage } from "@/routes/system/UnauthorizedPage"

export function createAppRouter(
  featureRoutes: readonly RouteObject[] = [],
): ReturnType<typeof createBrowserRouter> {
  return createBrowserRouter([
    ...featureRoutes,
    {
      element: <AuthLayout />,
      errorElement: <SystemErrorPage />,
      children: [
        {
          path: "/auth/login",
          lazy: async () => {
            const { LoginPage } = await import("@/features/auth/pages/LoginPage")
            return { Component: LoginPage }
          },
        },
        {
          path: "/admin/login",
          lazy: async () => {
            const { AdminLoginPage } = await import(
              "@/features/auth/pages/AdminLoginPage"
            )
            return { Component: AdminLoginPage }
          },
        },
        {
          path: "/auth/register",
          lazy: async () => {
            const { RegisterPage } = await import(
              "@/features/auth/pages/RegisterPage"
            )
            return { Component: RegisterPage }
          },
        },
        {
          path: "/auth/forgot-password",
          lazy: async () => {
            const { ForgotPasswordPage } = await import(
              "@/features/auth/pages/ForgotPasswordPage"
            )
            return { Component: ForgotPasswordPage }
          },
        },
      ],
    },
    {
      element: <ProtectedRoute allowedRoles={["PATIENT"]} />,
      errorElement: <SystemErrorPage />,
      children: [
        {
          element: <PatientLayout />,
          children: [
            {
              path: "/dashboard",
              lazy: async () => {
                const { PatientDashboardPage } = await import(
                  "@/features/dashboard/pages/PatientDashboardPage"
                )
                return { Component: PatientDashboardPage }
              },
            },
            {
              path: "/predict",
              lazy: async () => {
                const { PredictionPage } = await import(
                  "@/features/predictions/pages/PredictionPage"
                )
                return { Component: PredictionPage }
              },
            },
            {
              path: "/predictions",
              lazy: async () => {
                const { PredictionHistoryPage } = await import(
                  "@/features/history/pages/PredictionHistoryPage"
                )
                return { Component: PredictionHistoryPage }
              },
            },
            {
              path: "/assessments",
              lazy: async () => {
                const { PredictionHistoryPage } = await import(
                  "@/features/history/pages/PredictionHistoryPage"
                )
                return { Component: PredictionHistoryPage }
              },
            },
            {
              path: "/analytics",
              lazy: async () => {
                const { HealthAnalyticsPage } = await import(
                  "@/features/dashboard/pages/HealthAnalyticsPage"
                )
                return { Component: HealthAnalyticsPage }
              },
            },
            {
              path: "/reports/:assessmentId",
              lazy: async () => {
                const { AssessmentReportPage } = await import(
                  "@/features/predictions/pages/AssessmentReportPage"
                )
                return { Component: AssessmentReportPage }
              },
            },
            {
              path: "/chat",
              lazy: async () => {
                const { ChatPage } = await import(
                  "@/features/chat/pages/ChatPage"
                )
                return { Component: ChatPage }
              },
            },
            {
              path: "/profile",
              lazy: async () => {
                const { ProfilePage } = await import(
                  "@/features/profile/pages/ProfilePage"
                )
                return { Component: ProfilePage }
              },
            },
            {
              path: "/settings",
              lazy: async () => {
                const { SettingsPage } = await import(
                  "@/features/settings/pages/SettingsPage"
                )
                return { Component: SettingsPage }
              },
            },
          ],
        },
      ],
    },
    {
      element: <ProtectedRoute allowedRoles={["DOCTOR"]} />,
      errorElement: <SystemErrorPage />,
      children: [
        {
          element: <DoctorLayout />,
          children: [
            {
              path: "/doctor",
              lazy: async () => {
                const { DoctorDashboardPage } = await import(
                  "@/features/doctor/pages/DoctorDashboardPage"
                )
                return { Component: DoctorDashboardPage }
              },
            },
          ],
        },
      ],
    },
    {
      element: (
        <ProtectedRoute
          allowedRoles={["ADMIN"]}
          loginPath="/admin/login"
        />
      ),
      errorElement: <SystemErrorPage />,
      children: [
        {
          element: <AdminLayout />,
          children: [
            {
              path: "/admin",
              element: <Navigate replace to="/admin/dashboard" />,
            },
            {
              path: "/admin/dashboard",
              lazy: async () => {
                const { AdminDashboardPage } = await import(
                  "@/features/admin/pages/AdminDashboardPage"
                )
                return { Component: AdminDashboardPage }
              },
            },
            {
              path: "/admin/users",
              lazy: async () => {
                const { AdminUsersPage } = await import(
                  "@/features/admin/pages/AdminUsersPage"
                )
                return { Component: AdminUsersPage }
              },
            },
            {
              path: "/admin/analytics",
              lazy: async () => {
                const { AdminAnalyticsPage } = await import(
                  "@/features/admin/pages/AdminAnalyticsPage"
                )
                return { Component: AdminAnalyticsPage }
              },
            },
            {
              path: "/admin/assessments",
              lazy: async () => {
                const { AdminAssessmentsPage } = await import(
                  "@/features/admin/pages/AdminAssessmentsPage"
                )
                return { Component: AdminAssessmentsPage }
              },
            },
            {
              path: "/admin/chats",
              lazy: async () => {
                const { AdminChatsPage } = await import(
                  "@/features/admin/pages/AdminChatsPage"
                )
                return { Component: AdminChatsPage }
              },
            },
            {
              path: "/admin/system-health",
              lazy: async () => {
                const { AdminSystemHealthPage } = await import(
                  "@/features/admin/pages/AdminSystemHealthPage"
                )
                return { Component: AdminSystemHealthPage }
              },
            },
            {
              path: "/admin/*",
              element: <NotFoundPage />,
            },
          ],
        },
      ],
    },
    {
      element: <PublicLayout />,
      errorElement: <SystemErrorPage />,
      children: [
        {
          path: "/",
          lazy: async () => {
            const { LandingPage } = await import(
              "@/features/landing/pages/LandingPage"
            )
            return { Component: LandingPage }
          },
        },
        {
          path: "/unauthorized",
          element: <UnauthorizedPage />,
        },
        {
          path: "/forbidden",
          element: <ForbiddenPage />,
        },
        {
          path: "/service-unavailable",
          element: <ServiceUnavailablePage />,
        },
        {
          path: "*",
          element: <NotFoundPage />,
        },
      ],
    },
  ])
}

export const appRouter = createAppRouter()
