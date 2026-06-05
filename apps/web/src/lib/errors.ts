export function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError && e.message.toLowerCase().includes('fetch')
}

export function toastIfNotNetwork(e: unknown, toastFn: (msg: string) => void) {
  if (!isNetworkError(e)) {
    toastFn((e as Error).message)
  }
}
