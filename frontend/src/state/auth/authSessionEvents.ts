const sessionExpiredEvent = "mediai:session-expired"

export function notifySessionExpired(): void {
  globalThis.dispatchEvent?.(new Event(sessionExpiredEvent))
}

export function subscribeToSessionExpired(listener: () => void): () => void {
  globalThis.addEventListener?.(sessionExpiredEvent, listener)
  return () => globalThis.removeEventListener?.(sessionExpiredEvent, listener)
}
