import { ApiError } from './api'

export function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError && e.message.toLowerCase().includes('fetch')
}

/**
 * 402 (Premium-gate) surfaces centrally in api.ts's `request` helper: it toasts
 * the upgrade message and dispatches `formplan:entitlement-changed`. Callers must
 * not toast it again, or the user sees the same message twice.
 */
export function isPaymentRequired(e: unknown): boolean {
  return e instanceof ApiError && e.status === 402
}

export function toastIfNotNetwork(e: unknown, toastFn: (msg: string) => void) {
  if (isNetworkError(e) || isPaymentRequired(e)) return
  toastFn((e as Error).message ?? 'Något gick fel')
}
