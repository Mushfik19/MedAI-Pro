import { useId } from "react"
import {
  useFormContext,
  type FieldValues,
  type Path,
} from "react-hook-form"
import { Input, type InputProps } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils/cn"

export interface FormTextFieldProps<TFieldValues extends FieldValues>
  extends Omit<InputProps, "name"> {
  name: Path<TFieldValues>
  label: string
  description?: string
  containerClassName?: string
}

export function FormTextField<TFieldValues extends FieldValues>({
  className,
  containerClassName,
  description,
  id: providedId,
  label,
  name,
  required,
  ...props
}: FormTextFieldProps<TFieldValues>): React.JSX.Element {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const {
    formState,
    getFieldState,
    register,
  } = useFormContext<TFieldValues>()
  const fieldState = getFieldState(name, formState)
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = fieldState.error ? `${id}-error` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <div className={cn("grid gap-2", containerClassName)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="ml-1 text-destructive">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </Label>
      <Input
        aria-describedby={describedBy}
        aria-invalid={fieldState.invalid}
        className={className}
        id={id}
        required={required}
        {...props}
        {...register(name)}
      />
      {description ? (
        <p className="text-sm leading-5 text-muted-foreground" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {fieldState.error?.message ? (
        <p className="text-sm font-medium text-destructive" id={errorId}>
          {fieldState.error.message}
        </p>
      ) : null}
    </div>
  )
}
