import { useQuery } from "@tanstack/react-query"
import { dashboardService } from "@/features/dashboard/api/dashboard.service"

export const dashboardKey = ["dashboard", "patient"] as const

export function usePatientDashboardQuery() {
  return useQuery({
    queryKey: dashboardKey,
    queryFn: dashboardService.getDashboard,
  })
}
