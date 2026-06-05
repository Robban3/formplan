// Minimal toast store — no dependencies, consumed via useSyncExternalStore.

export type ToastType = 'error' | 'success' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export const toastStore = {
  getSnapshot: () => toasts,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  push(message: string, type: ToastType = 'info', durationMs = 4000) {
    const id = nextId++
    toasts = [...toasts, { id, message, type }]
    emit()
    setTimeout(() => toastStore.dismiss(id), durationMs)
    return id
  },
  dismiss(id: number) {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  },
}

export const toast = {
  error: (m: string) => toastStore.push(m, 'error'),
  success: (m: string, durationMs?: number) => toastStore.push(m, 'success', durationMs),
  info: (m: string) => toastStore.push(m, 'info'),
}
