import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { doctorService } from "@/features/doctor/api/doctor.service"

export const doctorKeys = {
  workspace: (search: string) => ["doctor", "workspace", search] as const,
}

export function useDoctorWorkspaceQuery(search: string) {
  return useQuery({
    queryKey: doctorKeys.workspace(search),
    queryFn: () => doctorService.getWorkspace(search),
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateClinicalNoteMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: doctorService.createNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["doctor"] })
    },
  })
}

export function useQueueDoctorReportMutation() {
  return useMutation({ mutationFn: doctorService.queueReport })
}
