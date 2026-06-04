import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from './supabase'
import type { Env, FitnessProfile, WorkoutDay, NutritionDay, RestDay } from './types'

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
