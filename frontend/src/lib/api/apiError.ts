import { isAxiosError } from "axios"
import {
  isProblemDetails,
  type FieldProblem,
  type ProblemDetails,
} from "@/lib/api/problemDetails"

const fallbackProblem: ProblemDetails = {
  type: "about:blank",
  title: "Unable to complete the request",
  status: 0,
  detail: "Please check your connection and try again.",
}

export class ApiError extends Error {
  public readonly status: number
  public readonly type: string
  public readonly requestId: string | undefined
  public readonly fieldErrors: readonly FieldProblem[]

  public constructor(problem: ProblemDetails, options?: ErrorOptions) {
    super(problem.detail, options)
    this.name = "ApiError"
    this.status = problem.status
    this.type = problem.type
    this.requestId = problem.request_id
    this.fieldErrors = problem.errors ?? []
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (isAxiosError(error) && isProblemDetails(error.response?.data)) {
    return new ApiError(error.response.data, { cause: error })
  }

  if (error instanceof Error) {
    return new ApiError(fallbackProblem, { cause: error })
  }

  return new ApiError(fallbackProblem)
}
