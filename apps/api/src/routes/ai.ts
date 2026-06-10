import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth'
import { coachReply } from '../lib/ai'
import type { AppContext } from '../lib/types'

export const aiRouter = new Hono<AppContext>()

aiRouter.use('*', requireAuth)

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
})

// POST /ai/coach — conversational coach grounded in the user's own data.
aiRouter.post(
  '/coach',
  zValidator(
    'json',
    z.object({
      messages: z.array(messageSchema).min(1).max(30),
      context: z.string().max(2000).optional(),
    })
  ),
  async (c) => {
    const user = c.get('user')
    const b = c.req.valid('json')
    try {
      const reply = await coachReply(user.sub, b.messages, b.context ?? '', c.env)
      return c.json({ reply })
    } catch (err) {
      console.error('AI coach failed:', err)
      return c.json({ error: 'AI coach unavailable' }, 502)
    }
  }
)
