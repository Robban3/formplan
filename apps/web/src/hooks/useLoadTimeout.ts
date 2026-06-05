import { useEffect } from 'react'

const LOAD_TIMEOUT_MS = 8_000

export function useLoadTimeout(setLoading: (v: boolean) => void) {
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), LOAD_TIMEOUT_MS)
    return () => clearTimeout(id)
  }, [setLoading])
}
