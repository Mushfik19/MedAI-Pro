import type { FieldValues, Path, UseFormSetError } from "react-hook-form"
import { ApiError } from "@/lib/api/apiError"

export function applyApiFormErrors<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
  fieldMap: Readonly<Record<string, Path<TValues>>> = {},
): boolean {
  if (!(error instanceof ApiError) || error.fieldErrors.length === 0) {
    return false
  }

  for (const fieldError of error.fieldErrors) {
    setError(fieldMap[fieldError.field] ?? (fieldError.field as Path<TValues>), {
      message: fieldError.message,
      type: "server",
    })
  }

  return true
}
