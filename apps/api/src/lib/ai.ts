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

const PRIMARY_MODEL = 'claude-opus-4-8'
// Widely-available model used if the configured one isn't accessible.
const FALLBACK_MODEL = 'claude-3-5-sonnet-latest'
// Gemini har en gratis nivå och stödjer både vision och JSON-läge.
const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash'

// ── Provider-neutral AI-abstraktion ─────────────────────────────────────────
// Stödjer Anthropic (standard) och Google Gemini. Välj med env.AI_PROVIDER.
// Båda normaliseras till { text, stopReason } så resten av koden är
// provider-oberoende.

type AiContent =
  | string
  | Array<{ text: string } | { image: { mediaType: ImageMediaType; data: string } }>

interface AiMessage {
  role: 'user' | 'assistant'
  content: AiContent
}

interface AiRequest {
  system?: string
  messages: AiMessage[]
  maxTokens: number
  /** Be modellen svara med ren JSON (Gemini sätter responseMimeType). */
  json?: boolean
  /** 0–1; högre = mer variation/kreativitet. */
  temperature?: number
}

interface AiResult {
  text: string
  stopReason: string | null
}

function aiProvider(env: Env): 'anthropic' | 'gemini' {
  return env.AI_PROVIDER === 'gemini' ? 'gemini' : 'anthropic'
}

async function callAi(req: AiRequest, env: Env): Promise<AiResult> {
  // Try the selected provider first, then fall back to the other on ANY failure
  // (missing key, bad key, unavailable model …). As long as one provider has a
  // working key, AI keeps working.
  const preferred = aiProvider(env)
  const order: Array<'gemini' | 'anthropic'> =
    preferred === 'gemini' ? ['gemini', 'anthropic'] : ['anthropic', 'gemini']

  let lastErr: unknown
  for (const p of order) {
    if (p === 'gemini' && !env.GEMINI_API_KEY) continue
    if (p === 'anthropic' && !env.ANTHROPIC_API_KEY) continue
    try {
      return p === 'gemini' ? await callGemini(req, env) : await callAnthropic(req, env)
    } catch (err) {
      console.warn(`AI provider "${p}" failed; trying next if available.`, err)
      lastErr = err
    }
  }
  throw lastErr ?? new Error('Ingen AI-provider konfigurerad (sätt GEMINI_API_KEY eller ANTHROPIC_API_KEY).')
}

// ── Anthropic ────────────────────────────────────────────────────────────────

function toAnthropicContent(content: AiContent): string | Anthropic.ContentBlockParam[] {
  if (typeof content === 'string') return content
  return content.map((p) =>
    'text' in p
      ? { type: 'text' as const, text: p.text }
      : {
          type: 'image' as const,
          source: { type: 'base64' as const, media_type: p.image.mediaType, data: p.image.data },
        }
  )
}

// Call Claude, retrying once on a stable model if the configured model is
// unavailable for this account. We retry on any error (not just 404/400) as
// long as we haven't already tried the fallback — a misconfigured or
// not-yet-released primary model can surface as 403/404/400/etc., and a single
// retry on a known-good model is cheap insurance against a hard outage.
async function callAnthropic(req: AiRequest, env: Env): Promise<AiResult> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  const params: Anthropic.MessageCreateParamsNonStreaming = {
    model: env.ANTHROPIC_MODEL ?? PRIMARY_MODEL,
    max_tokens: req.maxTokens,
    ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
    ...(req.system ? { system: req.system } : {}),
    messages: req.messages.map((m) => ({ role: m.role, content: toAnthropicContent(m.content) })),
  }

  let message: Anthropic.Message
  try {
    message = await client.messages.create(params)
  } catch (err) {
    if (params.model === FALLBACK_MODEL) throw err
    const status = (err as { status?: number }).status
    console.warn(
      `Claude model "${params.model}" failed (status ${status ?? 'unknown'}); retrying on ${FALLBACK_MODEL}`
    )
    message = await client.messages.create({ ...params, model: FALLBACK_MODEL })
  }

  const text = message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
  return { text, stopReason: message.stop_reason }
}

// ── Google Gemini ─────────────────────────────────────────────────────────────

interface GeminiPart {
  text?: string
  inline_data?: { mime_type: string; data: string }
}
interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: GeminiPart[] }; finishReason?: string }>
  error?: { message?: string }
}

function toGeminiParts(content: AiContent): GeminiPart[] {
  if (typeof content === 'string') return [{ text: content }]
  return content.map((p) =>
    'text' in p ? { text: p.text } : { inline_data: { mime_type: p.image.mediaType, data: p.image.data } }
  )
}

async function callGemini(req: AiRequest, env: Env): Promise<AiResult> {
  const apiKey = env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY saknas (krävs när AI_PROVIDER=gemini)')
  const model = env.GEMINI_MODEL ?? GEMINI_DEFAULT_MODEL

  const body = {
    ...(req.system ? { system_instruction: { parts: [{ text: req.system }] } } : {}),
    // Gemini använder rollen 'model' i stället för 'assistant'.
    contents: req.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: toGeminiParts(m.content),
    })),
    generationConfig: {
      maxOutputTokens: req.maxTokens,
      // Gemini 2.5 räknar "thinking"-tokens mot maxOutputTokens och kan annars
      // hugga av/tömma svaret. Stäng av thinking så hela budgeten går till svaret.
      thinkingConfig: { thinkingBudget: 0 },
      ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
      ...(req.json ? { responseMimeType: 'application/json' } : {}),
    },
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    }
  )

  const data = (await res.json()) as GeminiResponse
  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${data.error?.message ?? res.statusText}`)
  }
  const candidate = data.candidates?.[0]
  const text = (candidate?.content?.parts ?? []).map((p) => p.text ?? '').join('')
  // Throw on empty output (safety block, MAX_TOKENS with no text, …) so callAi
  // can fall back to the other provider instead of returning '' → JSON.parse fail.
  if (!text.trim()) {
    throw new Error(`Gemini gav inget användbart svar (finishReason: ${candidate?.finishReason ?? 'okänd'})`)
  }
  return { text, stopReason: candidate?.finishReason ?? null }
}

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
  const db = supabaseAdmin(env)

  const { text: rawText } = await callAi(
    {
      system:
        'You are a certified personal trainer and nutritionist. Always respond with valid JSON only — no markdown, no explanation.',
      messages: [{ role: 'user', content: buildPrompt(profile) }],
      maxTokens: 8192,
      json: true,
    },
    env
  )

  const parsed = JSON.parse(extractJson(rawText)) as {
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

  const { text } = await callAi(
    {
      system,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
      maxTokens: 700,
    },
    env
  )

  return text.trim()
}

// ── AI-genererade recept ────────────────────────────────────────────────────

export type RecipeCategory = 'kott' | 'fisk' | 'pasta' | 'vegetariskt' | 'veganskt'

// Hård regel per vald kategori — styr huvudråvara/kosthållning.
const CATEGORY_RULES: Record<RecipeCategory, string> = {
  kott: 'Receptet SKA byggas på kött (t.ex. nöt, fläsk eller kyckling) – ingen fisk eller skaldjur.',
  fisk: 'Receptet SKA byggas på fisk eller skaldjur.',
  pasta: 'Receptet SKA vara en pastarätt med pasta som bas.',
  vegetariskt:
    'Receptet SKA vara vegetariskt – inget kött, ingen fisk eller skaldjur (ägg och mejeri är ok).',
  veganskt:
    'Receptet SKA vara veganskt – inga animaliska produkter alls (inget kött, fisk, ägg, mejeri eller honung).',
}

export interface RecipeRequest {
  prompt: string
  calorie_target?: number | null | undefined
  min_protein_g?: number | null | undefined
  allergies?: string[] | undefined
  meal_type?: string | null | undefined
  category?: RecipeCategory | null | undefined
}

// Tolerate the model occasionally wrapping JSON in prose/code fences.
function extractJson(text: string): string {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  return start >= 0 && end > start ? text.slice(start, end + 1) : text
}

export async function generateRecipe(req: RecipeRequest, env: Env): Promise<GeneratedRecipe> {
  const constraints: string[] = []
  if (req.calorie_target) constraints.push(`Kalorimål: ca ${req.calorie_target} kcal per portion`)
  if (req.min_protein_g) constraints.push(`Minst ${req.min_protein_g} g protein per portion`)
  if (req.meal_type) constraints.push(`Måltidstyp: ${req.meal_type}`)
  if (req.category) constraints.push(CATEGORY_RULES[req.category])
  if (req.allergies?.length)
    constraints.push(`MÅSTE undvikas (allergier/kosthänsyn): ${req.allergies.join(', ')}`)

  const user = `Skapa ett recept utifrån önskemålet: "${req.prompt}".
${constraints.length ? `Krav:\n- ${constraints.join('\n- ')}\n` : ''}
Var kreativ och variera — välj gärna olika proteinkällor och kök mellan gångerna (inte alltid lax eller kyckling). Slumpfrö: ${crypto.randomUUID()}.
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

  const { text: rawText } = await callAi(
    {
      system:
        'Du är en svensk kock och nutritionist. Svara alltid med enbart giltig JSON — ingen markdown, ingen förklaring.',
      messages: [{ role: 'user', content: user }],
      maxTokens: 1500,
      json: true,
      temperature: 1,
    },
    env
  )

  return JSON.parse(extractJson(rawText)) as GeneratedRecipe
}

// ── Fotoanalys av mat ───────────────────────────────────────────────────────

export async function analyzeFoodPhoto(
  imageBase64: string,
  mediaType: ImageMediaType,
  env: Env
): Promise<FoodPhotoAnalysis> {
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

  const { text: rawText, stopReason } = await callAi(
    {
      system: 'Svara alltid med enbart giltig JSON — ingen markdown, ingen förklaring.',
      messages: [
        {
          role: 'user',
          content: [{ image: { mediaType, data: imageBase64 } }, { text: prompt }],
        },
      ],
      maxTokens: 2048,
      json: true,
    },
    env
  )

  try {
    return JSON.parse(extractJson(rawText)) as FoodPhotoAnalysis
  } catch (err) {
    // Log the actual model output so a parse failure is diagnosable instead of
    // surfacing as an opaque 502.
    console.error(
      `Food photo: could not parse model JSON (stop_reason=${stopReason}). Raw response:`,
      rawText.slice(0, 1000)
    )
    throw new Error(`Food photo analysis returned unparseable output: ${(err as Error).message}`)
  }
}
