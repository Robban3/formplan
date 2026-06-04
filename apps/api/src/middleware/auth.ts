import { createMiddleware } from 'hono/factory'
import { verifyJwt } from '../lib/supabase'
import type { Env, JwtPayload } from '../lib/types'

type AuthVariables = { user: JwtPayload }

export const requireAuth = createMiddleware<{
  Bindings: Env
  Variables: AuthVariables
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)
  const user = await verifyJwt(token, c.env)
  if (!user) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  c.set('user', user)
  await next()
})
