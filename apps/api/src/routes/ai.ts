import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth'
import { requireAccess, requireVerifiedEmail } from '../middleware/access'
import { coachReply, generateRecipe, analyzeFoodPhoto, estimateMeal, friendlyAiError } from '../lib/ai'
import { langFromHeader, LANG_HEADER } from '../lib/lang'
import { rateLimit } from '../lib/rateLimit'
import { supabaseAdmin } from '../lib/supabase'
import { validationHook } from '../lib/validation'
import type { AppContext } from '../lib/types'

export const aiRouter = new Hono<AppContext>()

aiRouter.use('*', requireAuth)
// AI är en premium-funktion — kräver aktiv provperiod eller prenumeration.
aiRouter.use('*', requireAccess)
// Kräv bekräftad e-post — blockerar massregistrerade obekräftade konton från
// att dra AI-kostnader. Körs efter paywallen (obetalda ser 402 först).
aiRouter.use('*', requireVerifiedEmail)

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
})

// POST /ai/coach — conversational coach grounded in the user's own data.
aiRouter.post(
  '/coach',
  rateLimit('ai-coach', 20),
  zValidator(
    'json',
    z.object({
      messages: z.array(messageSchema).min(1).max(30),
      context: z.string().max(2000).optional(),
    }),
    validationHook
  ),
  async (c) => {
    const user = c.get('user')
    const b = c.req.valid('json')
    try {
      const reply = await coachReply(user.sub, b.messages, b.context ?? '', c.env, langFromHeader(c.req.header(LANG_HEADER)))
      return c.json({ reply })
    } catch (err) {
      console.error('AI coach failed:', err)
      const { message, status } = friendlyAiError(err)
      return c.json({ error: message }, status)
    }
  }
)

// POST /ai/recipe — generate a recipe from goals, macros and allergies.
aiRouter.post(
  '/recipe',
  rateLimit('ai-recipe', 30),
  zValidator(
    'json',
    z.object({
      prompt: z.string().min(1).max(500),
      calorie_target: z.number().int().positive().max(3000).nullable().optional(),
      min_protein_g: z.number().int().nonnegative().max(300).nullable().optional(),
      allergies: z.array(z.string().max(60)).max(30).optional(),
      meal_type: z.string().max(40).nullable().optional(),
      category: z.enum(['kott', 'fisk', 'pasta', 'vegetariskt', 'veganskt']).nullable().optional(),
    }),
    validationHook
  ),
  async (c) => {
    const b = c.req.valid('json')
    const user = c.get('user')

    // Allergierna hämtas HÄR, ur profilen — klientens lista får aldrig vara
    // enda källan. Receptsidan fyller sin lista asynkront och började på en
    // tom array, så ett tryck på Generera innan profilen svarat skickade
    // `allergies: []`. Prompten säger då inget om allergier alls, och modellen
    // fick aktivt veta att det inte fanns några. Det är AI-genererad mat
    // användaren faktiskt lagar.
    //
    // UNION, inte enbart profilen: UI:t speglar idag bara profilen, men en
    // tillfällig hänsyn för ett enskilt recept ska kunna läggas till utan att
    // tappa de sparade.
    const db = supabaseAdmin(c.env)
    const { data: rows, error: profileErr } = await db.query<{ allergies: string[] }[]>(
      `/fitness_profile?user_id=eq.${user.sub}&select=allergies&limit=1`
    )

    // FAIL CLOSED. Går profilen inte att läsa vet vi inte vad som ska
    // uteslutas, och då kan vi inte filtrera rätt. Ett recept som kanske
    // innehåller användarens allergen är värre än inget recept.
    if (profileErr) {
      console.error('Recipe generation: could not read allergies:', profileErr)
      return c.json(
        { error: 'Kunde inte läsa dina kosthänsyn just nu, så inget recept skapades. Försök igen.' },
        503
      )
    }

    const allergies = [...new Set([...(rows?.[0]?.allergies ?? []), ...(b.allergies ?? [])])]

    try {
      const recipe = await generateRecipe({ ...b, allergies }, c.env, langFromHeader(c.req.header(LANG_HEADER)))
      return c.json({ recipe })
    } catch (err) {
      console.error('Recipe generation failed:', err)
      const { message, status } = friendlyAiError(err)
      return c.json({ error: message }, status)
    }
  }
)

// POST /ai/food-photo — estimate a meal's nutrition from a photo (base64).
aiRouter.post(
  '/food-photo',
  rateLimit('ai-food-photo', 30),
  zValidator(
    'json',
    z.object({
      image: z.string().min(1).max(8_000_000),
      media_type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    }),
    validationHook
  ),
  async (c) => {
    const b = c.req.valid('json')
    try {
      const analysis = await analyzeFoodPhoto(b.image, b.media_type, c.env, langFromHeader(c.req.header(LANG_HEADER)))
      return c.json({ analysis })
    } catch (err) {
      console.error('Food photo analysis failed:', err)
      const { message, status } = friendlyAiError(err)
      return c.json({ error: message }, status)
    }
  }
)

// POST /ai/estimate-meal — uppskatta kcal/makros för en fritextmåltid.
aiRouter.post(
  '/estimate-meal',
  rateLimit('ai-estimate-meal', 30),
  zValidator('json', z.object({ description: z.string().min(1).max(200) }), validationHook),
  async (c) => {
    const b = c.req.valid('json')
    try {
      const estimate = await estimateMeal(b.description, c.env, langFromHeader(c.req.header(LANG_HEADER)))
      return c.json({ estimate })
    } catch (err) {
      console.error('Meal estimate failed:', err)
      const { message, status } = friendlyAiError(err)
      return c.json({ error: message }, status)
    }
  }
)
