import {
  Activity,
  Bot,
  ChartNoAxesCombined,
  ClipboardClock,
  Database,
  FileClock,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react"
import { ApplicationLayout } from "@/components/layout/ApplicationLayout"
import { AuthenticatedHeaderActions } from "@/components/navigation/AuthenticatedHeaderActions"

const patientNavigation = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, end: true },
  { label: "Disease prediction", to: "/predict", icon: Activity },
  { label: "Assessment history", to: "/assessments", icon: FileClock },
  { label: "Health analytics", to: "/analytics", icon: ChartNoAxesCombined },
  { label: "AI Chat", to: "/chat", icon: Bot },
  { label: "Profile", to: "/profile", icon: UserRound },
  { label: "Settings", to: "/settings", icon: Settings },
] as const

const doctorNavigation = [
  { label: "Dashboard", to: "/doctor", icon: LayoutDashboard, end: true },
  { label: "Review queue", to: "/doctor#review-queue", icon: ClipboardClock },
  { label: "Patients", to: "/doctor#patients", icon: Users },
  { label: "Clinical reports", to: "/doctor#reports", icon: Stethoscope },
] as const

const adminNavigation = [
  { label: "Overview", to: "/admin/dashboard", icon: LayoutDashboard, end: true },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Analytics", to: "/admin/analytics", icon: ChartNoAxesCombined },
  { label: "Assessments", to: "/admin/assessments", icon: FileClock },
  { label: "AI chat monitoring", to: "/admin/chats", icon: Bot },
  { label: "System health", to: "/admin/system-health", icon: ShieldCheck },
  { label: "Datasets & models", to: "/admin/dashboard#datasets", icon: Database },
] as const

export function PatientLayout(): React.JSX.Element {
  return (
    <ApplicationLayout
      headerActions={<AuthenticatedHeaderActions />}
      navigation={patientNavigation}
      productArea="Patient workspace"
    />
  )
}

export function DoctorLayout(): React.JSX.Element {
  return (
    <ApplicationLayout
      headerActions={<AuthenticatedHeaderActions />}
      navigation={doctorNavigation}
      productArea="Clinical workspace"
    />
  )
}

export function AdminLayout(): React.JSX.Element {
  return (
    <ApplicationLayout
      headerActions={<AuthenticatedHeaderActions />}
      navigation={adminNavigation}
      productArea="Operations"
    />
  )
}
