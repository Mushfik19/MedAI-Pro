import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { profileService } from "@/features/profile/api/profile.service"

export const profileKey = ["users", "me", "profile"] as const

export function useProfileQuery() {
  return useQuery({ queryKey: profileKey, queryFn: profileService.get })
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileService.update,
    onSuccess: (profile) => queryClient.setQueryData(profileKey, profile),
  })
}
