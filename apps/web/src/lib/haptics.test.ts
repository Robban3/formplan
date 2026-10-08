import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Haptiken.
 *
 * Buggen: `navigator.vibrate?.([100, 50, 100])` när man nådde vattenmålet.
 * Apple har aldrig implementerat Vibration API:t, så på iPhone hände
 * ingenting — och `?.` gjorde raden till en tyst no-op, så det syntes inte i
 * koden. Samma mönster som wakeLock och notiserna hade.
 */

const cap = { native: true }
const plugin = { notification: vi.fn() }

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => cap.native } }))
vi.mock('@capacitor/haptics', () => ({
  Haptics: { notification: (...a: unknown[]) => plugin.notification(...a) },
  NotificationType: { Success: 'SUCCESS' },
}))

const { hapticSuccess } = await import('./haptics')

const vibrate = vi.fn()
beforeEach(() => {
  cap.native = true
  plugin.notification.mockReset().mockResolvedValue(undefined)
  vibrate.mockReset()
  vi.stubGlobal('navigator', { vibrate })
})

describe('hapticSuccess', () => {
  it('använder Capacitor i appen, inte navigator.vibrate', async () => {
    hapticSuccess()
    expect(plugin.notification).toHaveBeenCalledWith({ type: 'SUCCESS' })
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('använder navigator.vibrate på webben', async () => {
    cap.native = false
    hapticSuccess()
    expect(vibrate).toHaveBeenCalledWith([100, 50, 100])
    expect(plugin.notification).not.toHaveBeenCalled()
  })

  // En enhet utan haptik, eller en användare som stängt av den, får inte
  // fälla firandet.
  it('ett fel från pluginet kastar inte vidare', async () => {
    plugin.notification.mockRejectedValue(new Error('ingen haptik'))
    expect(() => hapticSuccess()).not.toThrow()
    await new Promise((r) => setTimeout(r, 0))
  })

  it('kraschar inte när navigator.vibrate saknas (iOS Safari)', () => {
    cap.native = false
    vi.stubGlobal('navigator', {})
    expect(() => hapticSuccess()).not.toThrow()
  })
})
