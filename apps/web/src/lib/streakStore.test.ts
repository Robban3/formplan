import { describe, it, expect, vi, beforeEach } from 'vitest'

// streakStore reads sessions via workoutSessionStore, which touches
// localStorage/sessionStorage/window at import time — stub them first.
function makeStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  } as Storage
}

const localStorageMock = makeStorage()
vi.stubGlobal('localStorage', localStorageMock)
vi.stubGlobal('sessionStorage', makeStorage())
vi.stubGlobal('window', {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  setInterval,
  clearInterval,
})

const { getTrainingStreak, getLongestStreak } = await import('./streakStore')

const KEY = 'formplan_workout_sessions'

function session(completedAt: Date, id = Math.random().toString(36).slice(2)) {
  return {
    id: `s-${id}`,
    plan_day_id: null,
    workout_name: `Pass ${id}`,
    started_at: completedAt.toISOString(),
    completed_at: completedAt.toISOString(),
    duration_seconds: 1800,
    total_sets: 10,
    completed_sets: 10,
    total_volume_kg: 1000,
  }
}

function daysAgo(n: number, hour = 18): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, 30, 0, 0)
  return d
}

beforeEach(() => {
  localStorageMock.clear()
})

describe('getTrainingStreak', () => {
  it('returns 0 with no sessions', () => {
    expect(getTrainingStreak()).toBe(0)
  })

  it('counts consecutive local days ending today', () => {
    localStorage.setItem(KEY, JSON.stringify([session(daysAgo(0)), session(daysAgo(1)), session(daysAgo(2))]))
    expect(getTrainingStreak()).toBe(3)
  })

  it('is broken by a gap day', () => {
    localStorage.setItem(KEY, JSON.stringify([session(daysAgo(0)), session(daysAgo(2))]))
    expect(getTrainingStreak()).toBe(1)
  })

  it('is 0 when the last session is older than yesterday', () => {
    localStorage.setItem(KEY, JSON.stringify([session(daysAgo(2)), session(daysAgo(3))]))
    expect(getTrainingStreak()).toBe(0)
  })

  it('buckets sessions logged just after local midnight on the local day', () => {
    // 00:30 local time — the UTC date string may differ, but the local day
    // must decide the streak bucket.
    localStorage.setItem(KEY, JSON.stringify([session(daysAgo(0, 0)), session(daysAgo(1, 0))]))
    expect(getTrainingStreak()).toBe(2)
  })
})

describe('getLongestStreak', () => {
  it('finds the longest historical run', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        session(daysAgo(0)),
        // gap at 1
        session(daysAgo(2)),
        session(daysAgo(3)),
        session(daysAgo(4)),
      ])
    )
    expect(getLongestStreak()).toBe(3)
  })
})
