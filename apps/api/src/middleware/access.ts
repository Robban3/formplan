import { createMiddleware } from 'hono/factory'
import { resolveAccess, FULL_ACCESS_EMAILS } from '../lib/access'
import type { Env, JwtPayload } from '../lib/types'

// Gate premium-only routes server-side. Must run after requireAuth (reads the
// user it set). Returns 402 so the client can distinguish "log in" (401) from
// "needs subscription" and route to the paywall.
export const requireAccess = createMiddleware<{
  Bindings: Env
  Variables: { user: JwtPayload }
}>(async (c, next) => {
  const user = c.get('user')
  const status = await resolveAccess(user, c.env)
  if (!status.access) {
    return c.json({ error: 'Provperioden är slut – uppgradera till Premium.', code: 'premium_required' }, 402)
  }
  await next()
})

// Kräv bekräftad e-post innan de dyra AI-endpointsen får användas. Massregistrerade
// obekräftade konton är den huvudsakliga vektorn för AI-kostnadsmissbruk. Måste köra
// efter requireAuth (läser user som satts där). Magic-link/OTP-användare bekräftas
// automatiskt vid första inloggningen, så vanliga användare påverkas inte. Konton i
// FULL_ACCESS_EMAILS (test/admin) undantas. Gate:a INTE icke-AI-routes med denna.
export const requireVerifiedEmail = createMiddleware<{
  Bindings: Env
  Variables: { user: JwtPayload }
}>(async (c, next) => {
  const user = c.get('user')
  const exempt = !!user.email && FULL_ACCESS_EMAILS.has(user.email.toLowerCase())
  if (!exempt && !user.email_verified) {
    return c.json(
      {
        error: 'Bekräfta din e-postadress för att använda AI-funktionerna.',
        code: 'email_unverified',
      },
      403
    )
  }
  await next()
})
