export interface FieldProblem {
  field: string
  code: string
  message: string
}

export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail: string
  instance?: string
  request_id?: string
  errors?: FieldProblem[]
}

export function isProblemDetails(value: unknown): value is ProblemDetails {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as Partial<ProblemDetails>
  return (
    typeof candidate.type === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.status === "number" &&
    typeof candidate.detail === "string"
  )
}
