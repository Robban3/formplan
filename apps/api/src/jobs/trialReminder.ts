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
 * Idempotens: finns env.RATE_LIMIT_KV sätts en "skickad"-markör per användare
 * (trial_reminder:<userId>) med ~40 dygns TTL. Då kan fönstret vidgas till
 * [TRIAL_DAYS-3, TRIAL_DAYS-1) för att tåla att cron:en driver, utan risk för
 * dubbelutskick. Saknas KV faller vi tillbaka på det exakt 24 h breda fönstret
 * [TRIAL_DAYS-2, TRIAL_DAYS-1) som (med daglig cron) träffar varje användare en
 * gång utan någon persisterad flagga.
 */
export async function sendTrialReminders(env: Env): Promise<void> {
  const kv = env.RATE_LIMIT_KV
  // Med KV-markör kan fönstret vidgas för att tåla cron-drift; utan den behålls
  // det smala 24 h-fönstret.
  const lowerBoundDays = kv ? TRIAL_DAYS - 3 : TRIAL_DAYS - 2

  const now = Date.now()

  // GoTrue Admin paginerar (page 1-indexerad, per_page). Loopa tills en kort
  // sida returneras så användare > 1000 inte tappas.
  const PER_PAGE = 1000
  for (let page = 1; ; page++) {
    const usersRes = await fetch(
      `${env.SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${PER_PAGE}`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    )
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
    if (!users?.length) break

    for (const user of users) {
      if (!user.email || !user.created_at) continue
      if (FULL_ACCESS_EMAILS.has(user.email.toLowerCase())) continue

      const ageDays = (now - Date.parse(user.created_at)) / DAY
      if (ageDays < lowerBoundDays || ageDays >= TRIAL_DAYS - 1) continue

      try {
        // Redan påmind (persisterad markör) → hoppa så en re-körning inte dubblar.
        const markerKey = `trial_reminder:${user.id}`
        if (kv && (await kv.get(markerKey))) continue

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

        // Markera som skickad (~40 dygns TTL täcker hela provperiodsfönstret).
        if (kv) await kv.put(markerKey, '1', { expirationTtl: 40 * 86_400 })

        // Liten paus mellan varje mail för att inte överbelasta Resend.
        await new Promise((r) => setTimeout(r, 100))
      } catch (err) {
        console.error(`Trial-påminnelse misslyckades för ${user.email}:`, err)
      }
    }

    if (users.length < PER_PAGE) break
  }
}
