import { useSyncExternalStore } from 'react'
import { toastStore } from '../../lib/toast'

const STYLES = {
  error: 'bg-red-600 text-white',
  success: 'bg-forest-600 text-white',
  info: 'bg-stone-800 text-white',
}

export function Toaster() {
  const toasts = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, toastStore.getSnapshot)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => toastStore.dismiss(t.id)}
          className={`pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lg text-left ${STYLES[t.type]}`}
        >
          {t.message}
        </button>
      ))}
    </div>
  )
}
