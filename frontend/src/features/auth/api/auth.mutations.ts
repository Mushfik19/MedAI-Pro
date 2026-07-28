import { useMutation } from "@tanstack/react-query"
import { authService } from "@/features/auth/api/auth.service"

export function useLoginMutation() {
  return useMutation({ mutationFn: authService.login })
}

export function useAdminLoginMutation() {
  return useMutation({ mutationFn: authService.adminLogin })
}

export function useRegistrationMutation() {
  return useMutation({ mutationFn: authService.register })
}

export function useLogoutMutation() {
  return useMutation({ mutationFn: authService.logout })
}

export function usePasswordResetRequestMutation() {
  return useMutation({ mutationFn: authService.requestPasswordReset })
}
