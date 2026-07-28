export interface DateTimeFormatOptions {
  locale?: string
  timeZone?: string
  dateStyle?: Intl.DateTimeFormatOptions["dateStyle"]
  timeStyle?: Intl.DateTimeFormatOptions["timeStyle"]
}

export function formatDateTime(
  value: string | number | Date,
  options: DateTimeFormatOptions = {},
): string {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Unavailable"
  }

  const {
    locale,
    timeZone,
    dateStyle = "medium",
    timeStyle = "short",
  } = options

  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
    ...(timeZone ? { timeZone } : {}),
  }).format(date)
}
