import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminService } from "@/features/admin/api/admin.service"

export const adminDashboardKey = ["admin", "dashboard"] as const
export const adminUsersKey = ["admin", "users"] as const

export function useAdminDashboardQuery() {
  return useQuery({ queryKey: adminDashboardKey, queryFn: adminService.getDashboard })
}

export function useAdminAnalyticsQuery() {
  return useQuery({ queryKey: ["admin", "analytics"], queryFn: adminService.getAnalytics })
}

export function useAdminUsersQuery(filters: {
  search?: string
  role?: string
  status?: string
}) {
  return useQuery({
    queryKey: [...adminUsersKey, filters],
    queryFn: () => adminService.getUsers(filters),
  })
}

export function useAdminUserStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminService.updateUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminUsersKey })
      await queryClient.invalidateQueries({ queryKey: adminDashboardKey })
    },
  })
}

export function useAdminDeleteUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminUsersKey })
      await queryClient.invalidateQueries({ queryKey: adminDashboardKey })
    },
  })
}

export function useAdminAssessmentsQuery(search: string) {
  return useQuery({
    queryKey: ["admin", "assessments", search],
    queryFn: () => adminService.getAssessments(search),
  })
}

export function useAdminChatsQuery() {
  return useQuery({ queryKey: ["admin", "chats"], queryFn: adminService.getChats })
}

export function useAdminSystemHealthQuery() {
  return useQuery({
    queryKey: ["admin", "system-health"],
    queryFn: adminService.getSystemHealth,
    refetchInterval: 30_000,
  })
}

export function useUploadDatasetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminService.uploadDataset,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminDashboardKey })
    },
  })
}

export function useStartTrainingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminService.startTraining,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminDashboardKey })
    },
  })
}
