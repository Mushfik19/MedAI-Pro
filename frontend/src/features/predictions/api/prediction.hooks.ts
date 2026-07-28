import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { predictionKeys } from "@/features/predictions/api/prediction.keys"
import {
  predictionService,
  type PredictionHistoryFilters,
} from "@/features/predictions/api/prediction.service"

export function useSymptomsQuery(search: string) {
  return useQuery({
    queryKey: predictionKeys.symptoms(search),
    queryFn: () => predictionService.listSymptoms(search),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreatePredictionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: predictionService.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: predictionKeys.all })
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

export function useAssessmentQuery(id: string, enabled = true) {
  return useQuery({
    enabled: Boolean(id) && enabled,
    queryFn: () => predictionService.getAssessment(id),
    queryKey: predictionKeys.assessment(id),
  })
}

export function usePredictionHistoryQuery(filters: PredictionHistoryFilters) {
  return useQuery({
    queryKey: predictionKeys.history(
      filters.query ?? "",
      filters.reviewStatus ?? "all",
    ),
    queryFn: () => predictionService.listHistory(filters),
    placeholderData: (previousData) => previousData,
  })
}

export function usePredictionHistoryExportMutation() {
  return useMutation({ mutationFn: predictionService.requestHistoryExport })
}

export function usePredictionReportMutation() {
  return useMutation({ mutationFn: predictionService.getReportDownload })
}
