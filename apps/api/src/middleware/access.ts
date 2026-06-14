import { createMiddleware } from 'hono/factory'
import { resolveAccess } from '../lib/access'
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
