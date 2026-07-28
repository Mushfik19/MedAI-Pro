import { useId, type PropsWithChildren } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils/cn"

export interface FormFieldLayoutProps extends PropsWithChildren {
  label: string
  description?: string
  error?: string
  required?: boolean
  className?: string
  controlId?: string
}

export function FormFieldLayout({
  children,
  className,
  controlId,
  description,
  error,
  label,
  required = false,
}: FormFieldLayoutProps): React.JSX.Element {
  const generatedId = useId()
  const id = controlId ?? generatedId
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-destructive">
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </Label>
      <div
        data-control-id={id}
        data-description-id={descriptionId}
        data-error-id={errorId}
      >
        {children}
      </div>
      {description ? (
        <p className="text-sm leading-5 text-muted-foreground" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm font-medium leading-5 text-destructive" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
