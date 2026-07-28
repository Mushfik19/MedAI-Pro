import { QueryClient } from "@tanstack/react-query"
import { ApiError } from "@/lib/api/apiError"

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) {
    return false
  }

  if (error instanceof ApiError) {
    return (
      error.status === 0 ||
      error.status === 408 ||
      error.status === 425 ||
      error.status === 429 ||
      error.status >= 500
    )
  }

  return failureCount < 1
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
        staleTime: 30 * 1000,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
