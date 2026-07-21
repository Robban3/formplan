import type { Env } from '../lib/types'
import { isUserPremium } from '../lib/supabase'
import { sendEmail, trialEndingEmail } from '../lib/email'
import { TRIAL_DAYS, FULL_ACCESS_EMAILS } from '../lib/access'

const DAY = 86_400_000

/**
 * Körs dagligen via Cloudflare cron. Mejlar användare vars app-provperiod
 * (TRIAL_DAYS dagar från registrering) snart tar slut och som ännu inte är
 * Premium, med en uppmaning att uppgradera.
 *
 * Provperioden är app-styrd (se access.ts), inte en Stripe-trial — checkouten
 * sätter inget trial_period_days — så Stripes trial_will_end-event triggas
 * aldrig. Därför sköts påminnelsen här utifrån registreringsdatum i stället.
 *
 * Idempotens: fönstret [5, 6) dygn efter registrering är exakt 24 h brett och
 * cron:en kör var 24:e timme, så varje användare träffas precis en gång — ingen
 * "påminnelse skickad"-flagga behövs. (Med TRIAL_DAYS = 7 ger det ~2 dygn kvar.)
 */
export async function sendTrialReminders(env: Env): Promise<void> {
  const usersRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })
  if (!usersRes.ok) {
    console.error('Trial-påminnelse: kunde inte hämta användare', await usersRes.text())
    return
  }
  const { users } = (await usersRes.json()) as {
    users: {
      id: string
      email?: string
      created_at?: string
      user_metadata?: Record<string, string>
    }[]
  }
  if (!users?.length) return

  const now = Date.now()

  for (const user of users) {
    if (!user.email || !user.created_at) continue
    if (FULL_ACCESS_EMAILS.has(user.email.toLowerCase())) continue

    const ageDays = (now - Date.parse(user.created_at)) / DAY
    if (ageDays < TRIAL_DAYS - 2 || ageDays >= TRIAL_DAYS - 1) continue

    try {
      // Redan betalande → hoppa (kollar status active/trialing + premium_until).
      if (await isUserPremium(user.id, env)) continue

      const trialEnd = Date.parse(user.created_at) + TRIAL_DAYS * DAY
      const daysLeft = Math.max(1, Math.ceil((trialEnd - now) / DAY))
      const name =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email.split('@')[0] ??
        'där'

      await sendEmail(env.RESEND_API_KEY, {
        to: user.email,
        subject: `Din provperiod tar snart slut — ${daysLeft} ${daysLeft === 1 ? 'dag' : 'dagar'} kvar`,
        html: await trialEndingEmail({ firstName: name, daysLeft }),
      })

      // Liten paus mellan varje mail för att inte överbelasta Resend.
      await new Promise((r) => setTimeout(r, 100))
    } catch (err) {
      console.error(`Trial-påminnelse misslyckades för ${user.email}:`, err)
    }
  }
}
