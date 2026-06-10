import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth'
import { coachReply, generateRecipe, analyzeFoodPhoto } from '../lib/ai'
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
      // TEMP-DIAGNOSTIK: visa det underliggande Anthropic-felet i svaret.
      const detail = err instanceof Error ? err.message : String(err)
      const status = (err as { status?: number }).status
      return c.json({ error: 'AI coach unavailable', detail, status }, 502)
    }
  }
)

// POST /ai/recipe — generate a recipe from goals, macros and allergies.
aiRouter.post(
  '/recipe',
  zValidator(
    'json',
    z.object({
      prompt: z.string().min(1).max(500),
      calorie_target: z.number().int().positive().max(3000).nullable().optional(),
      min_protein_g: z.number().int().nonnegative().max(300).nullable().optional(),
      allergies: z.array(z.string().max(60)).max(30).optional(),
      meal_type: z.string().max(40).nullable().optional(),
    })
  ),
  async (c) => {
    const b = c.req.valid('json')
    try {
      const recipe = await generateRecipe(b, c.env)
      return c.json({ recipe })
    } catch (err) {
      console.error('Recipe generation failed:', err)
      return c.json({ error: 'Kunde inte generera recept' }, 502)
    }
  }
)

// POST /ai/food-photo — estimate a meal's nutrition from a photo (base64).
aiRouter.post(
  '/food-photo',
  zValidator(
    'json',
    z.object({
      image: z.string().min(1).max(8_000_000),
      media_type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    })
  ),
  async (c) => {
    const b = c.req.valid('json')
    try {
      const analysis = await analyzeFoodPhoto(b.image, b.media_type, c.env)
      return c.json({ analysis })
    } catch (err) {
      console.error('Food photo analysis failed:', err)
      return c.json({ error: 'Kunde inte analysera bilden' }, 502)
    }
  }
)
