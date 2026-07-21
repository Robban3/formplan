import { describe, it, expect } from 'vitest'
import { sanitizeSearchTerm, isUuid, isDateString } from './sanitize'

describe('sanitizeSearchTerm', () => {
  it('strips PostgREST metacharacters', () => {
    expect(sanitizeSearchTerm('kyckling*')).toBe('kyckling')
    expect(sanitizeSearchTerm('a,b(c)d&e=f')).toBe('a b c d e f')
    expect(sanitizeSearchTerm('*,()&=')).toBe('')
  })

  it('collapses whitespace and trims', () => {
    expect(sanitizeSearchTerm('  kvarg   med  bär ')).toBe('kvarg med bär')
  })

  it('leaves ordinary Swedish terms untouched', () => {
    expect(sanitizeSearchTerm('äggröra')).toBe('äggröra')
    expect(sanitizeSearchTerm('nötfärs 10%')).toBe('nötfärs 10%')
  })
})

describe('isUuid', () => {
  it('accepts valid uuids', () => {
    expect(isUuid('c3f1a9be-6a3f-4b1e-9d2a-1f0e5c7b8a90')).toBe(true)
    expect(isUuid('C3F1A9BE-6A3F-4B1E-9D2A-1F0E5C7B8A90')).toBe(true)
  })

  it('rejects PostgREST injection attempts and junk', () => {
    expect(isUuid('id=eq.x&user_id=neq.y')).toBe(false)
    expect(isUuid('not-a-uuid')).toBe(false)
    expect(isUuid('')).toBe(false)
  })
})

describe('isDateString', () => {
  it('accepts YYYY-MM-DD only', () => {
    expect(isDateString('2026-07-21')).toBe(true)
    expect(isDateString('2026-7-21')).toBe(false)
    expect(isDateString('2026-07-21&user_id=neq.x')).toBe(false)
  })
})
