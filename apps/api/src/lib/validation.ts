import type { Context } from 'hono'

// @hono/zod-validator's default 400-body serialises the raw ZodError object,
// which clients render as "[object Object]". This shared hook is passed as the
// third argument to every zValidator call and turns the first issue into a
// short readable message instead: { error: "Ogiltig förfrågan — fält: fel" }.

interface IssueLite {
  path: (string | number)[]
  message: string
}

type HookResult = { success: true } | { success: false; error: { issues: IssueLite[] } }

export function validationHook(result: HookResult, c: Context) {
  if (result.success) return
  const issue = result.error.issues[0]
  const path = issue?.path.join('.') ?? ''
  const detail = issue ? (path ? `${path}: ${issue.message}` : issue.message) : 'okänt fel'
  return c.json({ error: `Ogiltig förfrågan — ${detail}` }, 400)
}
