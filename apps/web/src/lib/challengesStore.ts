import { dateKey } from './derive'

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
