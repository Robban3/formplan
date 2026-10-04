import { dateKey } from './derive'
import type { TextKey, TranslateFn } from './i18n'

const KEY = 'formplan_challenges'

export type ChallengeCategory = 'training' | 'nutrition' | 'body'
export type ChallengeIconKey = 'flame' | 'dumbbell' | 'zap' | 'droplet' | 'target' | 'trophy'

export interface Challenge {
  id: string
  title: string
  description: string
  iconKey: ChallengeIconKey
  category: ChallengeCategory
  targetValue: number
  unit: string
  durationDays: number
  startDate: string | null
  progress: number
  currentValue: number
  completed: boolean
  completedDate: string | null
}

/**
 * Texterna slås upp via `id`, inte via de lagrade `title`/`description`/`unit`.
 *
 * En startad utmaning sparas i localStorage med sin text. Översattes den där
 * skulle redan startade utmaningar behålla sitt gamla språk för alltid, och en
 * migrering av lagrad data vore enda vägen ur det. Id:t finns redan och ändras
 * aldrig — därför hänger texten på det, och de lagrade fälten lämnas i fred
 * för bakåtkompatibilitet.
 */
export const CHALLENGE_TEXT_KEYS: Record<string, { title: TextKey; desc: TextKey; unit: TextKey | null }> = {
  'streak-30': { title: 'chal.streak30.title', desc: 'chal.streak30.desc', unit: 'chal.unit.sessions' },
  'volume-10k': { title: 'chal.volume10k.title', desc: 'chal.volume10k.desc', unit: null },
  'sessions-20': { title: 'chal.sessions20.title', desc: 'chal.sessions20.desc', unit: 'chal.unit.sessions' },
  'water-14': { title: 'chal.water14.title', desc: 'chal.water14.desc', unit: 'chal.unit.days' },
  'weight-5': { title: 'chal.weight5.title', desc: 'chal.weight5.desc', unit: null },
  'sessions-50': { title: 'chal.sessions50.title', desc: 'chal.sessions50.desc', unit: 'chal.unit.sessions' },
}

/** Texten för en utmaning i användarens språk. `unit: null` = 'kg', som inte översätts. */
export function challengeText(
  challenge: { id: string; title: string; description: string; unit: string },
  t: TranslateFn
): { title: string; description: string; unit: string } {
  const keys = CHALLENGE_TEXT_KEYS[challenge.id]
  if (!keys) return challenge
  return {
    title: t(keys.title),
    description: t(keys.desc),
    unit: keys.unit ? t(keys.unit) : challenge.unit,
  }
}

const PRESETS: Omit<Challenge, 'startDate' | 'progress' | 'currentValue' | 'completed' | 'completedDate'>[] = [
  {
    id: 'streak-30',
    title: '30-dagarsutmaning',
    description: 'Genomför 13 träningspass på 30 dagar (ca 3/vecka).',
    iconKey: 'flame',
    category: 'training',
    targetValue: 13,
    unit: 'pass',
    durationDays: 30,
  },
  {
    id: 'volume-10k',
    title: 'Lyft 10 000 kg',
    description: 'Lyft totalt 10 000 kg under en månad.',
    iconKey: 'dumbbell',
    category: 'training',
    targetValue: 10000,
    unit: 'kg',
    durationDays: 30,
  },
  {
    id: 'sessions-20',
    title: '20 pass',
    description: 'Klara 20 träningspass — ta den tid du behöver.',
    iconKey: 'zap',
    category: 'training',
    targetValue: 20,
    unit: 'pass',
    durationDays: 60,
  },
  {
    id: 'water-14',
    title: 'Hydreringsvana',
    description: 'Logga vatten 14 dagar i rad.',
    iconKey: 'droplet',
    category: 'nutrition',
    targetValue: 14,
    unit: 'dagar',
    durationDays: 14,
  },
  {
    id: 'weight-5',
    title: 'Gå ner 5 kg',
    description: 'Minska din vikt med 5 kg.',
    iconKey: 'target',
    category: 'body',
    targetValue: 5,
    unit: 'kg',
    durationDays: 90,
  },
  {
    id: 'sessions-50',
    title: '50-passsällskapet',
    description: 'Klara totalt 50 träningspass.',
    iconKey: 'trophy',
    category: 'training',
    targetValue: 50,
    unit: 'pass',
    durationDays: 180,
  },
]

function load(): Challenge[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Challenge[] }
  catch { return [] }
}

function save(challenges: Challenge[]) {
  localStorage.setItem(KEY, JSON.stringify(challenges))
}

export function getActiveChallenges(): Challenge[] {
  return load().filter((c) => !c.completed && c.startDate !== null)
}

export function getAvailablePresets(): Challenge[] {
  const active = new Set(load().map((c) => c.id))
  return PRESETS
    .filter((p) => !active.has(p.id))
    .map((p) => ({ ...p, startDate: null, progress: 0, currentValue: 0, completed: false, completedDate: null }))
}

export function getCompletedChallenges(): Challenge[] {
  return load().filter((c) => c.completed)
}

export function startChallenge(id: string): Challenge | null {
  const all = load()
  const preset = PRESETS.find((p) => p.id === id)
  if (!preset) return null
  const challenge: Challenge = {
    ...preset,
    startDate: dateKey(),
    progress: 0,
    currentValue: 0,
    completed: false,
    completedDate: null,
  }
  save([...all.filter((c) => c.id !== id), challenge])
  return challenge
}

export function updateChallengeProgress(id: string, currentValue: number) {
  const all = load()
  const c = all.find((x) => x.id === id)
  if (!c) return
  c.currentValue = currentValue
  c.progress = Math.min(100, Math.round((currentValue / c.targetValue) * 100))
  if (c.progress >= 100 && !c.completed) {
    c.completed = true
    c.completedDate = dateKey()
  }
  save(all)
}

export function abandonChallenge(id: string) {
  save(load().filter((c) => c.id !== id))
}
