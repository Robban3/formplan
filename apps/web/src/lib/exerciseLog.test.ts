import { describe, it, expect } from 'vitest'
import { isCardioExercise, exerciseUsesWeight } from './exerciseLog'
import { EXERCISE_CATALOG } from './exerciseCatalog'

// Klassificeringen styrde tidigare på nyckelord i namnet. Katalogen är nu
// sanningen — nyckelorden används bara för fritext som inte går att slå upp.
describe('isCardioExercise / exerciseUsesWeight', () => {
  it('does not treat a bicycle crunch as cardio', () => {
    // "Cykelcrunch" innehåller "cykl" → magövningen fick tid/distans-fält och
    // repsen loggades aldrig.
    expect(isCardioExercise('Cykelcrunch')).toBe(false)
    expect(exerciseUsesWeight('Cykelcrunch')).toBe(false)
  })

  it('treats catalog cardio without a cardio keyword as cardio', () => {
    // Varken "Gång" eller "Battle ropes" matchar något konditionsord — båda
    // fick ett viktfält.
    expect(isCardioExercise('Gång')).toBe(true)
    expect(exerciseUsesWeight('Gång')).toBe(false)
    expect(isCardioExercise('Battle ropes')).toBe(true)
  })

  it('keeps weighted lifts weighted', () => {
    expect(isCardioExercise('Bänkpress')).toBe(false)
    expect(exerciseUsesWeight('Bänkpress')).toBe(true)
    // Kettlebell swing ligger i kategorin Kondition men loggas med vikt —
    // därför styr logStyle, inte kategorin.
    expect(isCardioExercise('Kettlebell swing')).toBe(false)
    expect(exerciseUsesWeight('Kettlebell swing')).toBe(true)
  })

  it('lets a time-based target override the catalog', () => {
    expect(exerciseUsesWeight('Bänkpress', '30 s')).toBe(false)
  })

  it('resolves through exercise_id, not only the display name', () => {
    expect(isCardioExercise({ name: 'Promenad på band', exercise_id: 'gang' })).toBe(true)
  })

  it('falls back to keywords for free text outside the catalog', () => {
    expect(isCardioExercise('Skidåkning i motionsspår med löpsteg')).toBe(true)
    expect(exerciseUsesWeight('Farmer walk')).toBe(true)
  })

  // Varje katalogövning måste ha exakt ett loggsätt, och de tre lägena måste
  // vara ömsesidigt uteslutande.
  it('classifies every catalog exercise consistently', () => {
    for (const ex of EXERCISE_CATALOG) {
      const cardio = isCardioExercise(ex.name)
      const weight = exerciseUsesWeight(ex.name)
      expect(cardio).toBe(ex.logStyle === 'time')
      expect(weight).toBe(ex.logStyle === 'reps')
      expect(cardio && weight).toBe(false)
    }
  })
})
