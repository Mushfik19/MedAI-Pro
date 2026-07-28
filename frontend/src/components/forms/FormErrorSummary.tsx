import { CircleAlert } from "lucide-react"
import type {
  FieldErrors,
  FieldValues,
  Path,
} from "react-hook-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ErrorItem {
  field: string
  message: string
}

function collectErrors(
  errors: FieldErrors,
  prefix = "",
): ErrorItem[] {
  return Object.entries(errors).flatMap(([key, value]) => {
    const field = prefix ? `${prefix}.${key}` : key

    if (!value) {
      return []
    }

    if (typeof value.message === "string") {
      return [{ field, message: value.message }]
    }

    return collectErrors(value as FieldErrors, field)
  })
}

export interface FormErrorSummaryProps<TFieldValues extends FieldValues> {
  errors: FieldErrors<TFieldValues>
  focusField: (field: Path<TFieldValues>) => void
}

export function FormErrorSummary<TFieldValues extends FieldValues>({
  errors,
  focusField,
}: FormErrorSummaryProps<TFieldValues>): React.JSX.Element | null {
  const items = collectErrors(errors)

  if (items.length === 0) {
    return null
  }

  return (
    <Alert variant="danger">
      <CircleAlert aria-hidden="true" />
      <AlertTitle>Review the highlighted fields</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {items.map((item) => (
            <li key={item.field}>
              <button
                className="rounded-sm text-left underline underline-offset-2"
                onClick={() => focusField(item.field as Path<TFieldValues>)}
                type="button"
              >
                {item.message}
              </button>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
