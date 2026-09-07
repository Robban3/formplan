import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  EXERCISE_CATALOG,
  EXERCISE_CATEGORIES,
  MUSCLES,
  getExerciseById,
  matchExercise,
} from './exerciseCatalog'

// The test runs in node, so the generated catalog can be checked against the
// files actually shipped in public/. This is the guarantee that no exercise
// reaches the UI without its own, correct images.
const PUBLIC_DIR = fileURLToPath(new URL('../../public/', import.meta.url))

function publicPath(imagePath: string): string {
  return PUBLIC_DIR + imagePath.replace(/^\//, '')
}

describe('exerciseCatalog', () => {
  it('is non-empty', () => {
    expect(EXERCISE_CATALOG.length).toBeGreaterThan(0)
  })

  it('has unique ids', () => {
    const ids = EXERCISE_CATALOG.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })

  it('every entry has a name, a valid category and at least one primary muscle', () => {
    for (const ex of EXERCISE_CATALOG) {
      expect(ex.name.trim(), `${ex.id} saknar namn`).not.toBe('')
      expect(EXERCISE_CATEGORIES, `${ex.id} har ogiltig kategori`).toContain(ex.category)
      expect(ex.primaryMuscles.length, `${ex.id} saknar primärmuskel`).toBeGreaterThan(0)
    }
  })

  it('only references known muscle ids', () => {
    for (const ex of EXERCISE_CATALOG) {
      for (const m of [...ex.primaryMuscles, ...ex.secondaryMuscles]) {
        expect(MUSCLES, `${ex.id} refererar okänd muskel: ${m}`).toContain(m)
      }
      // A muscle listed as both primary and secondary would double-colour the map.
      const primary = new Set<string>(ex.primaryMuscles)
      for (const m of ex.secondaryMuscles) {
        expect(primary.has(m), `${ex.id} har ${m} som både primär och sekundär`).toBe(false)
      }
    }
  })

  it('has exactly two image paths per exercise', () => {
    for (const ex of EXERCISE_CATALOG) {
      expect(ex.images.length, `${ex.id} har fel antal bilder`).toBe(2)
      expect(ex.images[0]).not.toBe(ex.images[1])
      for (const img of ex.images) {
        expect(img, `${ex.id} har ogiltig bildsökväg: ${img}`).toMatch(
          /^\/exercises\/[a-z0-9-]+-[01]\.webp$/
        )
      }
    }
  })

  it('ships every referenced image file under public/', () => {
    const missing: string[] = []
    for (const ex of EXERCISE_CATALOG) {
      for (const img of ex.images) {
        if (!existsSync(publicPath(img))) missing.push(`${ex.id}: ${img}`)
      }
    }
    expect(missing, `Bilder saknas på disk:\n${missing.join('\n')}`).toEqual([])
  })

  it('never lets two exercises share an image', () => {
    const seen = new Map<string, string>()
    for (const ex of EXERCISE_CATALOG) {
      for (const img of ex.images) {
        const owner = seen.get(img)
        expect(owner, `${img} används av både ${owner} och ${ex.id}`).toBeUndefined()
        seen.set(img, ex.id)
      }
    }
  })

  it('resolves every entry by id and by its own name and aliases', () => {
    for (const ex of EXERCISE_CATALOG) {
      expect(getExerciseById(ex.id)).toBe(ex)
      expect(matchExercise(ex.name)?.id, `${ex.name} matchade fel övning`).toBe(ex.id)
      for (const alias of ex.aliases) {
        expect(matchExercise(alias), `aliaset "${alias}" matchade ingenting`).toBeDefined()
      }
    }
  })

  it('returns undefined instead of guessing on unknown names', () => {
    expect(getExerciseById('finns-inte')).toBeUndefined()
    expect(matchExercise('xyzzy quux')).toBeUndefined()
  })
})
