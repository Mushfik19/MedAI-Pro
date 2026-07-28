export function exhaustiveGuard(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`)
}
