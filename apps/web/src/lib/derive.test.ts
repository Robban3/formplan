import { describe, it, expect } from 'vitest'
import {
  deriveDifficulty,
  isoWeekday,
  dateKey,
  weekRange,
  sessionsThisWeek,
  weeklyCounts,
} from './derive'

describe('deriveDifficulty', () => {
  it('returns Hög for long or dense workouts', () => {
    expect(deriveDifficulty({ duration_minutes: 60, exercises: [] })).toBe('Hög')
    expect(
      deriveDifficulty({ duration_minutes: 45, exercises: new Array(8).fill({ name: 'x' }) })
    ).toBe('Hög')
  })

  it('returns Lätt for short or sparse workouts', () => {
    expect(deriveDifficulty({ duration_minutes: 25, exercises: new Array(6).fill({ name: 'x' }) })).toBe('Lätt')
    expect(deriveDifficulty({ duration_minutes: 45, exercises: [{ name: 'x' }] })).toBe('Lätt')
  })

  it('returns Medel in between', () => {
    expect(
      deriveDifficulty({ duration_minutes: 45, exercises: new Array(6).fill({ name: 'x' }) })
    ).toBe('Medel')
  })
})

describe('isoWeekday', () => {
  it('treats Sunday as 7', () => {
    expect(isoWeekday(new Date('2024-01-07T12:00:00'))).toBe(7)
    expect(isoWeekday(new Date('2024-01-01T12:00:00'))).toBe(1)
  })
})

describe('dateKey', () => {
  it('formats a local YYYY-MM-DD', () => {
    expect(dateKey(new Date(2024, 0, 5))).toBe('2024-01-05')
    expect(dateKey(new Date(2024, 11, 31))).toBe('2024-12-31')
  })
})

describe('weekRange', () => {
  it('spans Monday 00:00 to Sunday 23:59', () => {
    const wed = new Date('2024-01-03T15:00:00')
    const { from, to } = weekRange(wed)
    expect(isoWeekday(from)).toBe(1)
    expect(from.getHours()).toBe(0)
    expect(isoWeekday(to)).toBe(7)
    expect(Math.floor((to.getTime() - from.getTime()) / (24 * 3600 * 1000))).toBe(6)
  })
})

describe('sessionsThisWeek', () => {
  it('counts distinct days within the current week only', () => {
    const now = new Date('2024-01-03T12:00:00') // Wednesday
    const completed = [
      '2024-01-01T08:00:00', // Mon (this week)
      '2024-01-01T20:00:00', // Mon again (same day, not double-counted)
      '2024-01-03T07:00:00', // Wed (this week)
      '2023-12-31T07:00:00', // last week
    ]
    expect(sessionsThisWeek(completed, now)).toBe(2)
  })
})

describe('weeklyCounts', () => {
  it('buckets sessions into weeks with the current week last', () => {
    const now = new Date('2024-01-10T12:00:00') // week of Jan 8-14
    const completed = [
      '2024-01-09T08:00:00', // current week
      '2024-01-10T08:00:00', // current week
      '2024-01-02T08:00:00', // previous week
    ]
    const counts = weeklyCounts(completed, 4, now)
    expect(counts).toHaveLength(4)
    expect(counts[3]).toBe(2) // current week
    expect(counts[2]).toBe(1) // last week
    expect(counts[0]).toBe(0)
  })
})
