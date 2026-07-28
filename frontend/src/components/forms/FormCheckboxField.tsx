import { useId } from "react"
import {
  Controller,
  useFormContext,
  type FieldValues,
  type Path,
} from "react-hook-form"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils/cn"

export interface FormCheckboxFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>
  label: string
  description?: string
  className?: string
  disabled?: boolean
}

export function FormCheckboxField<TFieldValues extends FieldValues>({
  className,
  description,
  disabled,
  label,
  name,
}: FormCheckboxFieldProps<TFieldValues>): React.JSX.Element {
  const id = useId()
  const { control, formState, getFieldState } =
    useFormContext<TFieldValues>()
  const fieldState = getFieldState(name, formState)
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = fieldState.error ? `${id}-error` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex min-h-11 items-start gap-3">
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Checkbox
              aria-describedby={describedBy}
              aria-invalid={fieldState.invalid}
              checked={Boolean(field.value)}
              disabled={disabled}
              id={id}
              onBlur={field.onBlur}
              onCheckedChange={field.onChange}
              ref={field.ref}
            />
          )}
        />
        <div className="grid gap-1 pt-0.5">
          <Label htmlFor={id}>{label}</Label>
          {description ? (
            <p
              className="text-sm leading-5 text-muted-foreground"
              id={descriptionId}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {fieldState.error?.message ? (
        <p className="text-sm font-medium text-destructive" id={errorId}>
          {fieldState.error.message}
        </p>
      ) : null}
    </div>
  )
}
