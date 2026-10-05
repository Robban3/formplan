import { Capacitor } from '@capacitor/core'
import { KeepAwake } from '@capacitor-community/keep-awake'

/**
 * Håller skärmen tänd under ett pass.
 *
 * Buggen: inställningen fanns under Inställningar och lästes av
 * ActiveWorkout, men implementationen var `navigator.wakeLock` — ett
 * webb-API som INTE finns i iOS WebView. I native gjorde växeln alltså
 * ingenting: telefonen slocknade mitt i ett set och användaren fick låsa upp
 * den med svettiga händer mellan varje övning.
 *
 * Nu två vägar: Capacitor-pluginet i appen, wakeLock på webben. Webbvägen
 * behålls eftersom appen också körs i webbläsare — att ta bort den hade
 * försämrat den plattform som faktiskt fungerade.
 */

type Release = () => void

const noop: Release = () => {}

/**
 * Begär att skärmen hålls tänd. Returnerar en funktion som släpper den.
 *
 * Misslyckas begäran returneras en no-op i stället för att kasta: att inte
 * kunna hålla skärmen tänd får aldrig avbryta ett pass.
 */
export async function keepScreenAwake(): Promise<Release> {
  if (Capacitor.isNativePlatform()) {
    try {
      await KeepAwake.keepAwake()
      return () => {
        void KeepAwake.allowSleep().catch(() => {})
      }
    } catch {
      return noop
    }
  }

  // Webben: wakeLock finns i Chrome och Edge, inte i Safari.
  if (!('wakeLock' in navigator)) return noop
  try {
    const sentinel = await navigator.wakeLock.request('screen')
    return () => {
      void sentinel.release().catch(() => {})
    }
  } catch {
    // Nekad, eller dokumentet är inte synligt — ingen felhantering behövs.
    return noop
  }
}

/**
 * Går skärmen att hålla tänd på den här plattformen?
 *
 * Används för att dölja växeln där den inte gör något — en inställning som
 * inte har någon effekt är värre än ingen inställning, och det var precis
 * tillståndet före den här ändringen.
 */
export function canKeepScreenAwake(): boolean {
  return Capacitor.isNativePlatform() || 'wakeLock' in navigator
}
