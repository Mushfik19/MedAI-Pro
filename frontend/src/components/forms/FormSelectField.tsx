import { useId } from "react"
import {
  Controller,
  useFormContext,
  type FieldValues,
  type Path,
} from "react-hook-form"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils/cn"

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface FormSelectFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>
  label: string
  options: readonly SelectOption[]
  placeholder: string
  description?: string
  className?: string
  disabled?: boolean
  required?: boolean
}

export function FormSelectField<TFieldValues extends FieldValues>({
  className,
  description,
  disabled,
  label,
  name,
  options,
  placeholder,
  required = false,
}: FormSelectFieldProps<TFieldValues>): React.JSX.Element {
  const id = useId()
  const { control, formState, getFieldState } =
    useFormContext<TFieldValues>()
  const fieldState = getFieldState(name, formState)
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = fieldState.error ? `${id}-error` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <div className={cn("grid gap-2", className)}>
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
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            onValueChange={field.onChange}
            value={typeof field.value === "string" ? field.value : ""}
            {...(disabled === undefined ? {} : { disabled })}
          >
            <SelectTrigger
              aria-describedby={describedBy}
              aria-invalid={fieldState.invalid}
              id={id}
              onBlur={field.onBlur}
              ref={field.ref}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  {...(option.disabled === undefined
                    ? {}
                    : { disabled: option.disabled })}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
