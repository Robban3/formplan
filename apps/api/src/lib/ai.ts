import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from './supabase'
import type {
  Env,
  FitnessProfile,
  WorkoutDay,
  NutritionDay,
  RestDay,
  GeneratedRecipe,
  FoodPhotoAnalysis,
} from './types'

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp'

function buildPrompt(profile: FitnessProfile): string {
  const goalMap: Record<string, string> = {
    lose_weight: 'lose weight / cut fat',
    build_muscle: 'build muscle / bulk',
    maintain: 'maintain current fitness',
    improve_endurance: 'improve cardio endurance',
  }
  const levelMap: Record<string, string> = {
    beginner: 'beginner (0-1 year training)',
    intermediate: 'intermediate (1-3 years)',
    advanced: 'advanced (3+ years)',
  }

  return `You are an expert personal trainer and nutritionist. Create a personalized 7-day fitness and nutrition plan.

USER PROFILE:
- Goal: ${goalMap[profile.goal] ?? profile.goal}
- Experience level: ${levelMap[profile.level] ?? profile.level}
- Available equipment: ${profile.equipment.join(', ')}
- Training days per week: ${profile.days_per_week}
- Food allergies/restrictions: ${profile.allergies.length ? profile.allergies.join(', ') : 'none'}
- Daily calorie target: ${profile.calorie_goal ?? 'auto-calculate based on goal'}
${profile.age ? `- Age: ${profile.age}` : ''}
${profile.weight_kg ? `- Weight: ${profile.weight_kg} kg` : ''}
${profile.height_cm ? `- Height: ${profile.height_cm} cm` : ''}

INSTRUCTIONS:
- Distribute ${profile.days_per_week} workout days across the week. Remaining days are rest days.
- Every day gets a nutrition plan (macros + meals).
- Use Swedish food and meal names where appropriate (this is a Swedish product).
- Respond ONLY with valid JSON matching this exact schema:

{
  "days": [
    {
      "weekday": 1,
      "type": "workout",
      "content": {
        "name": "string",
        "focus": "string",
        "duration_minutes": number,
        "exercises": [
          { "name": "string", "sets": number, "reps": "string", "rest_seconds": number, "notes": "string (optional)" }
        ]
      },
      "nutrition": {
        "total_calories": number,
        "protein_g": number,
        "carbs_g": number,
        "fat_g": number,
        "meals": [
          { "name": "string", "time": "string", "calories": number, "items": ["string"] }
        ]
      }
    }
  ]
}

weekday: 1=Monday through 7=Sunday. Include all 7 days.`
}

export async function generatePlan(
  planId: string,
  profile: FitnessProfile,
  env: Env
): Promise<void> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  const db = supabaseAdmin(env)

  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8192,
    system:
      'You are a certified personal trainer and nutritionist. Always respond with valid JSON only — no markdown, no explanation.',
    messages: [{ role: 'user', content: buildPrompt(profile) }],
  })

  const rawText = message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')

  const parsed = JSON.parse(rawText) as {
    days: Array<{
      weekday: number
      type: 'workout' | 'rest'
      content: WorkoutDay | RestDay
      nutrition: NutritionDay
    }>
  }

  const dayRows = parsed.days.flatMap((d) => [
    {
      plan_id: planId,
      weekday: d.weekday,
      type: d.type,
      content: d.content,
    },
    {
      plan_id: planId,
      weekday: d.weekday,
      type: 'nutrition' as const,
      content: d.nutrition,
    },
  ])

  await db.query('/plan_day', {
    method: 'POST',
    body: JSON.stringify(dayRows),
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
  })

  await db.query(`/plan?id=eq.${planId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ready' }),
  })
}

// ── AI-coach ──────────────────────────────────────────────────────────────

export interface CoachMessage {
  role: 'user' | 'assistant'
  content: string
}

const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'gå ner i vikt / minska fett',
  build_muscle: 'bygga muskler',
  maintain: 'bibehålla nuvarande form',
  improve_endurance: 'förbättra konditionen',
}

// Pull together the user's real data so the coach can answer with specifics
// ("du låg 350 kcal under målet") rather than generic tips.
async function buildUserContext(userId: string, env: Env): Promise<string> {
  const db = supabaseAdmin(env)
  const lines: string[] = []

  const { data: profiles } = await db.query<FitnessProfile[]>(
    `/fitness_profile?user_id=eq.${userId}&limit=1`
  )
  const profile = profiles?.[0]
  if (profile) {
    lines.push(`Mål: ${GOAL_LABELS[profile.goal] ?? profile.goal}`)
    lines.push(`Erfarenhetsnivå: ${profile.level}`)
    if (profile.weight_kg) lines.push(`Vikt: ${profile.weight_kg} kg`)
    if (profile.height_cm) lines.push(`Längd: ${profile.height_cm} cm`)
    if (profile.calorie_goal) lines.push(`Kalorimål: ${profile.calorie_goal} kcal/dag`)
    lines.push(`Mål för träningsdagar/vecka: ${profile.days_per_week}`)
    if (profile.allergies?.length) lines.push(`Allergier/kosthänsyn: ${profile.allergies.join(', ')}`)
  }

  const since = new Date(Date.now() - 7 * 864e5)
  const sinceIso = since.toISOString()
  const sinceDate = sinceIso.slice(0, 10)

  const { data: sessions } = await db.query<{ total_volume_kg: number; completed_at: string }[]>(
    `/workout_session?user_id=eq.${userId}&completed_at=gte.${sinceIso}&select=total_volume_kg,completed_at&order=completed_at.desc`
  )
  if (sessions?.length) {
    const vol = Math.round(sessions.reduce((s, r) => s + (r.total_volume_kg ?? 0), 0))
    lines.push(`Träningspass senaste 7 dagarna: ${sessions.length} st (total lyft volym ${vol} kg).`)
  } else {
    lines.push('Inga träningspass loggade de senaste 7 dagarna.')
  }

  const { data: foodLogs } = await db.query<{ log_date: string; kcal: number; protein_g: number }[]>(
    `/food_log?user_id=eq.${userId}&log_date=gte.${sinceDate}&select=log_date,kcal,protein_g`
  )
  if (foodLogs?.length) {
    const byDay = new Map<string, { kcal: number; protein: number }>()
    for (const r of foodLogs) {
      const d = byDay.get(r.log_date) ?? { kcal: 0, protein: 0 }
      d.kcal += r.kcal
      d.protein += r.protein_g
      byDay.set(r.log_date, d)
    }
    const days = byDay.size
    const totals = [...byDay.values()].reduce(
      (acc, d) => ({ kcal: acc.kcal + d.kcal, protein: acc.protein + d.protein }),
      { kcal: 0, protein: 0 }
    )
    const avgKcal = Math.round(totals.kcal / days)
    const avgProtein = Math.round(totals.protein / days)
    lines.push(`Snittintag de ${days} senast loggade dagarna: ${avgKcal} kcal och ${avgProtein} g protein per dag.`)
    if (profile?.calorie_goal) {
      const diff = avgKcal - profile.calorie_goal
      lines.push(
        `Det är ${Math.abs(diff)} kcal ${diff < 0 ? 'under' : 'över'} kalorimålet (${profile.calorie_goal} kcal/dag).`
      )
    }
  } else {
    lines.push('Ingen kost loggad de senaste 7 dagarna.')
  }

  return lines.join('\n')
}

// Answer a chat turn as the personal coach, grounded in the user's own data.
export async function coachReply(
  userId: string,
  messages: CoachMessage[],
  clientContext: string,
  env: Env
): Promise<string> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  const serverContext = await buildUserContext(userId, env)
  const context = [serverContext, clientContext.trim()].filter(Boolean).join('\n')

  // The Anthropic API requires the conversation to start with a user turn —
  // drop the assistant greeting the UI seeds, and keep the recent history.
  const history = messages.slice(-20)
  while (history.length && history[0]!.role !== 'user') history.shift()
  if (history.length === 0) return 'Ställ gärna en fråga om din träning eller kost!'

  const system = `Du är FormPlans AI-coach — en kunnig, peppande och konkret personlig tränare och nutritionist. Du svarar alltid på svenska, kort och praktiskt (max ~150 ord), och du använder användarens faktiska data nedan för att ge personliga svar.

ANVÄNDARENS DATA:
${context || 'Ingen data tillgänglig ännu.'}

Riktlinjer:
- Referera till användarens data när det är relevant (t.ex. kaloriintag, antal pass, mål).
- Ge konkreta, handlingsbara råd. Ställ inga medicinska diagnoser.
- Hitta inte på siffror — använd bara data som finns ovan. Saknas data, uppmuntra användaren att logga pass/kost.
- Var ärlig, evidensbaserad och uppmuntrande.`

  const msg = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 700,
    system,
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  })

  return msg.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
}

// ── AI-genererade recept ────────────────────────────────────────────────────

export interface RecipeRequest {
  prompt: string
  calorie_target?: number | null | undefined
  min_protein_g?: number | null | undefined
  allergies?: string[] | undefined
  meal_type?: string | null | undefined
}

// Tolerate the model occasionally wrapping JSON in prose/code fences.
function extractJson(text: string): string {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  return start >= 0 && end > start ? text.slice(start, end + 1) : text
}

export async function generateRecipe(req: RecipeRequest, env: Env): Promise<GeneratedRecipe> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  const constraints: string[] = []
  if (req.calorie_target) constraints.push(`Kalorimål: ca ${req.calorie_target} kcal per portion`)
  if (req.min_protein_g) constraints.push(`Minst ${req.min_protein_g} g protein per portion`)
  if (req.meal_type) constraints.push(`Måltidstyp: ${req.meal_type}`)
  if (req.allergies?.length)
    constraints.push(`MÅSTE undvikas (allergier/kosthänsyn): ${req.allergies.join(', ')}`)

  const user = `Skapa ett recept utifrån önskemålet: "${req.prompt}".
${constraints.length ? `Krav:\n- ${constraints.join('\n- ')}\n` : ''}
Svara ENDAST med giltig JSON enligt exakt detta schema (på svenska, med realistiska näringsvärden per portion):
{
  "name": "string",
  "meal_type": "frukost|lunch|middag|mellanmål",
  "kcal": number,
  "protein_g": number,
  "fat_g": number,
  "carbs_g": number,
  "prep_minutes": number,
  "servings": number,
  "ingredients": ["mängd + ingrediens, t.ex. '150 g kycklingfilé'"],
  "steps": ["tydligt tillagningssteg"],
  "tags": ["kort etikett, t.ex. 'Högt protein'"]
}`

  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    system:
      'Du är en svensk kock och nutritionist. Svara alltid med enbart giltig JSON — ingen markdown, ingen förklaring.',
    messages: [{ role: 'user', content: user }],
  })

  const rawText = message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')

  return JSON.parse(extractJson(rawText)) as GeneratedRecipe
}

// ── Fotoanalys av mat ───────────────────────────────────────────────────────

export async function analyzeFoodPhoto(
  imageBase64: string,
  mediaType: ImageMediaType,
  env: Env
): Promise<FoodPhotoAnalysis> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  const prompt = `Du är en svensk nutritionist. Analysera måltiden på bilden och uppskatta näringsinnehållet så gott det går utifrån synliga portioner.
Svara ENDAST med giltig JSON enligt detta schema (svenska livsmedelsnamn, gram och realistiska värden):
{
  "description": "kort beskrivning av måltiden",
  "items": [
    { "name": "string", "amount_g": number, "kcal": number, "protein_g": number, "fat_g": number, "carbs_g": number }
  ],
  "total": { "kcal": number, "protein_g": number, "fat_g": number, "carbs_g": number }
}
Om bilden inte föreställer mat: returnera tomma "items", nollställd "total" och description "Ingen mat hittades".`

  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    system: 'Svara alltid med enbart giltig JSON — ingen markdown, ingen förklaring.',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          { type: 'text', text: prompt },
        ],
      },
    ],
  })

  const rawText = message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')

  return JSON.parse(extractJson(rawText)) as FoodPhotoAnalysis
}
