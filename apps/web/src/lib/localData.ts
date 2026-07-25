// Clears all locally cached app data so one account's data never bleeds into
// another's after a logout / account switch on the same device.
//
// Every store in the app uses a fixed, non-user-scoped key that begins with
// `formplan_` (in localStorage, and a few mirrors in sessionStorage). Rather
// than maintain a hand-written list that silently rots when a new store is
// added, we enumerate both storages and remove every `formplan_`-prefixed key.

const PREFIX = 'formplan_'

/**
 * Remove every FormPlan key from both localStorage and sessionStorage. Safe to
 * call when storage is unavailable (private mode / non-browser env).
 */
export function clearLocalUserData(): void {
  for (const storage of [
    typeof localStorage !== 'undefined' ? localStorage : null,
    typeof sessionStorage !== 'undefined' ? sessionStorage : null,
  ]) {
    if (!storage) continue
    try {
      const keys: string[] = []
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i)
        if (k && k.startsWith(PREFIX)) keys.push(k)
      }
      for (const k of keys) storage.removeItem(k)
    } catch {
      /* storage blocked — nothing to clear */
    }
  }
}
