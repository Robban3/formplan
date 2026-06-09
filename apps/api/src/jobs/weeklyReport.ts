import type { Env } from '../lib/types'
import { supabaseAdmin } from '../lib/supabase'
import { sendEmail, progressEmail } from '../lib/email'

/**
 * Körs varje måndag kl 07:00 UTC via Cloudflare cron.
 * Hämtar alla användare och skickar veckorapport.
 */
export async function sendWeeklyReports(env: Env): Promise<void> {
  const db = supabaseAdmin(env)

  // Hämta alla användare med e-post
  const { data: users } = await db.query<{ id: string; email: string; raw_user_meta_data: Record<string, string> }[]>(
    '/auth/users?select=id,email,raw_user_meta_data&limit=1000'
  )

  if (!users?.length) return

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Skicka rapport till varje användare (med liten fördröjning för att undvika rate limiting)
  for (const user of users) {
    try {
      // Hämta träningspass senaste 7 dagarna
      const { data: sessions } = await db.query<{ total_volume_kg: number; completed_at: string }[]>(
        `/workout_sessions?user_id=eq.${user.id}&completed_at=gte.${since}&select=total_volume_kg,completed_at`
      )

      // Hoppa över användare som inte tränat alls denna vecka
      if (!sessions?.length) continue

      const workouts = sessions.length
      const volumeKg = sessions.reduce((s, r) => s + (r.total_volume_kg ?? 0), 0)

      // Viktutveckling
      const { data: weights } = await db.query<{ weight_kg: number }[]>(
        `/measurements?user_id=eq.${user.id}&select=weight_kg,measured_at&order=measured_at.desc&limit=2`
      )
      const weightDelta =
        weights && weights.length === 2
          ? ((weights[0]?.weight_kg ?? 0) - (weights[1]?.weight_kg ?? 0))
          : null

      // Streak
      const { data: logs } = await db.query<{ completed_at: string }[]>(
        `/workout_sessions?user_id=eq.${user.id}&select=completed_at&order=completed_at.desc&limit=30`
      )
      let streak = 0
      if (logs?.length) {
        const days = new Set(logs.map((l) => l.completed_at.slice(0, 10)))
        let d = new Date()
        while (days.has(d.toISOString().slice(0, 10))) {
          streak++
          d.setDate(d.getDate() - 1)
        }
      }

      const name =
        user.raw_user_meta_data?.full_name ??
        user.raw_user_meta_data?.name ??
        user.email.split('@')[0] ??
        'där'

      await sendEmail(env.RESEND_API_KEY, {
        to: user.email,
        subject: `Din veckorapport — ${workouts} pass den här veckan 💪`,
        html: await progressEmail({ name, workouts, volumeKg, weightDelta, streak }),
      })

      // Liten paus mellan varje mail för att inte överbelasta Resend
      await new Promise((r) => setTimeout(r, 100))
    } catch (err) {
      console.error(`Veckorapport misslyckades för ${user.email}:`, err)
    }
  }
}
