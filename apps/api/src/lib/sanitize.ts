// Helpers for building safe PostgREST query strings from user input.

// Strip PostgREST filter metacharacters (* , ( ) & =) so a user-supplied
// search term can't inject extra wildcards or alter the filter tree when
// interpolated into an ilike pattern. Collapses the resulting whitespace.
export function sanitizeSearchTerm(term: string): string {
  return term
    .replace(/[*,()&=]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

// Strict YYYY-MM-DD (kalenderdatum). Används för query-params innan de
// interpoleras i PostgREST-filter.
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isDateString(value: string): boolean {
  return DATE_RE.test(value)
}
