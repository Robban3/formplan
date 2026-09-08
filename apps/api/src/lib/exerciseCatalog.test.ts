import { describe, it, expect } from 'vitest'
import { EXERCISE_CATALOG, getExerciseById, matchExercise } from './exerciseCatalog'

// Katalogen är GENERERAD (scripts/build-exercise-catalog.mjs) och delas med
// apps/web. Den här sviten är skyddsnätet mot att någon handredigerar den till
// något som tyst pekar fel: dubbletter bland id/namn/alias låter en nyckel
// skugga en annan i matchExercise, och då kan AI:ns id mappas till FEL övning.

const normalize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

describe('exercise catalog integrity', () => {
  it('is non-empty', () => {
    expect(EXERCISE_CATALOG.length).toBeGreaterThan(50)
  })

  it('has unique ids', () => {
    const ids = EXERCISE_CATALOG.map((e) => e.id)
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
  })

  it('has unique names', () => {
    const names = EXERCISE_CATALOG.map((e) => e.name)
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([])
  })

  // Ett alias som återanvänds (eller krockar med ett id/namn efter
  // normalisering) gör matchningen beroende av ordningen i filen.
  it('has no lookup key (id, name or alias) used by two exercises', () => {
    const owner = new Map<string, string>()
    const collisions: string[] = []
    for (const e of EXERCISE_CATALOG) {
      for (const key of [e.id, e.name, ...e.aliases]) {
        const n = normalize(key)
        const existing = owner.get(n)
        if (existing != null && existing !== e.id) {
          collisions.push(`"${key}" delas av ${existing} och ${e.id}`)
        }
        owner.set(n, e.id)
      }
    }
    expect(collisions).toEqual([])
  })

  it('resolves every id back to itself through getExerciseById and matchExercise', () => {
    const broken: string[] = []
    for (const e of EXERCISE_CATALOG) {
      if (getExerciseById(e.id)?.id !== e.id) broken.push(`getExerciseById(${e.id})`)
      if (matchExercise(e.id)?.id !== e.id) broken.push(`matchExercise(${e.id})`)
      if (matchExercise(e.name)?.id !== e.id) broken.push(`matchExercise(${e.name})`)
    }
    expect(broken).toEqual([])
  })

  it('resolves every alias to its own exercise', () => {
    const broken: string[] = []
    for (const e of EXERCISE_CATALOG) {
      for (const alias of e.aliases) {
        if (matchExercise(alias)?.id !== e.id) broken.push(`${alias} → ${e.id}`)
      }
    }
    expect(broken).toEqual([])
  })
})
