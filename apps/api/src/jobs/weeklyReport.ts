import type { Env } from '../lib/types'
import { supabaseAdmin } from '../lib/supabase'
import { sendEmail, progressEmail } from '../lib/email'

/**
 * Körs varje måndag kl 07:00 UTC via Cloudflare cron.
 * Hämtar alla användare och skickar veckorapport.
 */
export async function sendWeeklyReports(env: Env): Promise<void> {
  const db = supabaseAdmin(env)

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Hämta alla användare via GoTrue Admin API (auth.users nås inte via PostgREST).
  // GoTrue Admin paginerar (page 1-indexerad) men CAPAR per_page (ofta 50) och
  // kan returnera FÄRRE än begärt per sida. Att bryta på "kortare sida än
  // begärt" stoppar därför redan efter sida 1 och tappar resten — loopa i
  // stället tills en TOM sida returneras, med ett hårt sidtak som skydd mot
  // oändlig loop (t.ex. om servern ignorerar page).
  const PER_PAGE = 1000
  const MAX_PAGES = 100
  for (let page = 1; page <= MAX_PAGES; page++) {
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
      console.error('Veckorapport: kunde inte hämta användare', await usersRes.text())
      return
    }
    const { users } = (await usersRes.json()) as {
      users: { id: string; email?: string; user_metadata?: Record<string, string> }[]
    }

    if (!users?.length) break

    // Skicka rapport till varje användare (med liten fördröjning för att undvika rate limiting)
    for (const user of users) {
      if (!user.email) continue
      try {
        // Hämta träningspass senaste 7 dagarna
        const { data: sessions } = await db.query<{ total_volume_kg: number; completed_at: string }[]>(
          `/workout_session?user_id=eq.${user.id}&completed_at=gte.${since}&select=total_volume_kg,completed_at`
        )

        // Hoppa över användare som inte tränat alls denna vecka
        if (!sessions?.length) continue

        const workouts = sessions.length

        // Viktutveckling från body_measurement (första → sista vägning senaste
        // veckan). Feltolerant: saknas tabellen/data blir delta null.
        const { data: weights } = await db.query<{ measured_on: string; weight_kg: number | null }[]>(
          `/body_measurement?user_id=eq.${user.id}&measured_on=gte.${since.slice(0, 10)}&weight_kg=not.is.null&select=measured_on,weight_kg&order=measured_on.asc`
        )
        let weightDelta: number | null = null
        if (weights && weights.length >= 2) {
          const first = Number(weights[0]?.weight_kg)
          const last = Number(weights[weights.length - 1]?.weight_kg)
          if (Number.isFinite(first) && Number.isFinite(last)) {
            weightDelta = Math.round((last - first) * 10) / 10
          }
        }

        // Streak
        const { data: logs } = await db.query<{ completed_at: string }[]>(
          `/workout_session?user_id=eq.${user.id}&select=completed_at&order=completed_at.desc&limit=30`
        )
        let streak = 0
        if (logs?.length) {
          const days = new Set(logs.map((l) => l.completed_at.slice(0, 10)))
          // Rapporten körs måndag 07:00 innan någon hunnit träna, så dagens datum
          // saknas nästan alltid. En streak lever tills dagen är slut → börja
          // gårdagens datum om dagens saknas. (UTC-bucketing, gott nog.)
          const d = new Date()
          if (!days.has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 1)
          while (days.has(d.toISOString().slice(0, 10))) {
            streak++
            d.setUTCDate(d.getUTCDate() - 1)
          }
        }

        const name =
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email.split('@')[0] ??
          'där'

        await sendEmail(env.RESEND_API_KEY, {
          to: user.email,
          subject: `Din veckorapport — ${workouts} pass genomförda 💪`,
          html: await progressEmail({
            firstName: name,
            workoutsCompleted: workouts,
            workoutsTotal: 5,
            mealDaysCompleted: 0,
            mealDaysTotal: 7,
            weightChange: weightDelta,
            calorieDeficit: null,
            personalBests: 0,
            streak,
            motivationalMessage: 'Din kontinuitet placerar dig bland de mest aktiva användarna. Grymt jobbat!',
          }),
        })

        // Liten paus mellan varje mail för att inte överbelasta Resend
        await new Promise((r) => setTimeout(r, 100))
      } catch (err) {
        console.error(`Veckorapport misslyckades för ${user.id}:`, err)
      }
    }
  }
}
