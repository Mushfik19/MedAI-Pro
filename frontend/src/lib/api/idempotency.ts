export function createIdempotencyKey(): string {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error("Secure idempotency key generation is unavailable")
  }

  return globalThis.crypto.randomUUID()
}
