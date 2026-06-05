export const SESSIONS_UPDATED = 'formplan:sessions-updated'

export function notifySessionsUpdated() {
  window.dispatchEvent(new Event(SESSIONS_UPDATED))
}
