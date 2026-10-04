import { isUserPremium } from './supabase'
import type { Env, JwtPayload } from './types'

export const TRIAL_DAYS = 7
export const PRICE_SEK_ORE = 9900 // 99,00 kr/mån

/**
 * Konton som alltid har full åtkomst — kringgår provperiod och betalvägg.
 *
 * Här ligger bara de PERMANENTA: ägarna och granskningskontot. Testare läggs
 * i env-variabeln TESTER_EMAILS i stället (se testerEmails nedan) — de
 * växlar över tid, och tre privatpersoners adresser ska inte ligga kvar i
 * git-historiken efter att de slutat testa.
 */
export const FULL_ACCESS_EMAILS = new Set([
  'oliver@dronarkompaniet.se',
  'rvdv1122@gmail.com',
  'robert@applabbet.com',
  // Kontot Apple och Google granskar appen med. Provperioden är sju dagar, och
  // granskningen kan ske långt senare — eller göras om vid en uppdatering. Utan
  // undantaget möter granskaren betalväggen och avvisar appen med "kunde inte
  // komma åt funktionerna".
  'review@applabbet.com',
])

/**
 * TestFlight- och Play-testare, kommaseparerade i env.
 *
 * Utan undantaget får en testare sju dagar och möter sedan betalväggen — som
 * inte går att passera, eftersom köpflödet inte fungerar i native-appen än.
 * Testningen tar längre tid än en vecka, så de skulle låsas ut mitt i.
 *
 * I env och inte i koden: listan ändras när testgruppen ändras, och det ska
 * inte kräva en commit. Tom eller osatt variabel ⇒ inga extra konton.
 */
function testerEmails(env: Env): Set<string> {
  return new Set(
    (env.TESTER_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  )
}

/** Har kontot permanent åtkomst, antingen som ägare/granskare eller som testare? */
export function hasFullAccess(email: string | undefined, env: Env): boolean {
  if (!email) return false
  const normalized = email.toLowerCase()
  return FULL_ACCESS_EMAILS.has(normalized) || testerEmails(env).has(normalized)
}

export interface AccessStatus {
  access: boolean
  premium: boolean
  inTrial: boolean
  trialEndsAt: string
  trialDaysLeft: number
  /**
   * Sant bara när det finns en riktig Stripe-prenumeration att öppna
   * kundportalen för. Premium från FULL_ACCESS_EMAILS har ingen Stripe-kund, så
   * "Hantera prenumeration" ledde till 404 och ett rött felmeddelande över en
   * ruta som samtidigt sa "Premium aktivt". Klienten döljer knappen i stället.
   *
   * När in-app-köp (RevenueCat) läggs till gäller samma sak där: ett köp via
   * App Store hanteras i iOS-inställningarna, inte i Stripes portal.
   */
  manageable: boolean
}

// Single source of truth for "does this user have access right now": allowlist
// → active subscription → 7-day signup trial. Used by both /billing/status and
// the requireAccess middleware so the server enforces the same rule the UI shows.
export async function resolveAccess(user: JwtPayload, env: Env): Promise<AccessStatus> {
  if (hasFullAccess(user.email, env)) {
    return {
      access: true,
      premium: true,
      inTrial: false,
      trialEndsAt: new Date(0).toISOString(),
      trialDaysLeft: 0,
      manageable: false,
    }
  }

  const premium = await isUserPremium(user.sub, env)

  // No signup date → no trial (avoids granting an indefinite free trial).
  const created = user.created_at ? new Date(user.created_at) : null
  const trialEnd = created ? new Date(created.getTime() + TRIAL_DAYS * 86_400_000) : new Date(0)
  const now = new Date()
  const inTrial = created ? now < trialEnd : false
  const trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86_400_000))

  return {
    access: premium || inTrial,
    premium,
    inTrial: inTrial && !premium,
    trialEndsAt: trialEnd.toISOString(),
    trialDaysLeft: premium ? 0 : trialDaysLeft,
    // Premium här kommer från subscriptions-tabellen, som bara fylls av
    // Stripe-webhooken — alltså finns en kund att öppna portalen för.
    manageable: premium,
  }
}
