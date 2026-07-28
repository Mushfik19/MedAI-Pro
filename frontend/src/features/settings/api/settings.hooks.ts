import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { settingsService } from "@/features/settings/api/settings.service"

export const settingsKey = ["users", "me", "settings"] as const

export function useSettingsQuery() {
  return useQuery({ queryKey: settingsKey, queryFn: settingsService.get })
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: settingsService.update,
    onSuccess: (settings) => {
      queryClient.setQueryData(settingsKey, (current: unknown) => {
        if (!current || typeof current !== "object") {
          return current
        }
        return { ...current, settings }
      })
    },
  })
}

export function useDataExportMutation() {
  return useMutation({ mutationFn: settingsService.requestExport })
}

export function useDeletionRequestMutation() {
  return useMutation({ mutationFn: settingsService.requestDeletion })
}
