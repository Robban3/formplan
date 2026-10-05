// Pre-made training programs — always available, independent of any AI plan.

import { matchExercise } from './exerciseCatalog'
import type { TextKey } from './i18n'

export interface TemplateExercise {
  name: string
  sets: number
  reps: string
  rest_seconds: number
}

export interface TemplateDay {
  /** Stabilt internt namn. Visa nameKey — `name` är inte översatt. */
  name: string
  nameKey: TextKey
  exercises: TemplateExercise[]
}

export interface ProgramTemplate {
  id: string
  /** Stabila internnamn. Visa nameKey/descKey — de här är inte översatta. */
  name: string
  description: string
  nameKey: TextKey
  descKey: TextKey
  /** Används inte i gränssnittet, bara som metadata. */
  level: string
  days_per_week: number
  days: TemplateDay[]
}

const e = (name: string, sets: number, reps: string, rest_seconds = 90): TemplateExercise => ({
  name,
  sets,
  reps,
  rest_seconds,
})

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: 'helkropp-3',
    name: 'Helkropp 3 dagar',
    nameKey: 'prog.fullBody3.name',
    description: 'Bygg styrka och muskler med tre helkroppspass i veckan. Perfekt för nybörjare och medel.',
    descKey: 'prog.fullBody3.desc',
    level: 'Nybörjare–Medel',
    days_per_week: 3,
    days: [
      {
        name: 'Pass A',
        nameKey: 'prog.day.a',
        exercises: [e('Knäböj', 3, '8-10'), e('Bänkpress', 3, '8-10'), e('Skivstångsrodd', 3, '8-10'), e('Axelpress', 3, '10-12'), e('Plankan', 3, '45 s', 60)],
      },
      {
        name: 'Pass B',
        nameKey: 'prog.day.b',
        exercises: [e('Marklyft', 3, '5-6', 120), e('Hantelpress', 3, '8-10'), e('Latsdrag', 3, '10-12'), e('Utfallssteg', 3, '10/ben'), e('Hängande benlyft', 3, '12-15', 60)],
      },
      {
        name: 'Pass C',
        nameKey: 'prog.day.c',
        exercises: [e('Frontböj', 3, '8-10'), e('Pull-ups', 3, 'Max'), e('Lutande bänkpress', 3, '8-10'), e('Sidolyft', 3, '12-15', 60), e('Sit-ups', 3, '15-20', 60)],
      },
    ],
  },
  {
    id: 'ppl-3',
    name: 'Push / Pull / Ben',
    nameKey: 'prog.ppl.name',
    description: 'Klassisk uppdelning på tryck, drag och ben. För dig som vill träna 3–6 dagar i veckan.',
    descKey: 'prog.ppl.desc',
    level: 'Medel',
    days_per_week: 3,
    days: [
      {
        name: 'Push (tryck)',
        nameKey: 'prog.day.push',
        exercises: [e('Bänkpress', 4, '6-8', 120), e('Axelpress', 3, '8-10'), e('Lutande bänkpress', 3, '10-12'), e('Sidolyft', 3, '12-15', 60), e('Tricepspress', 3, '12-15', 60)],
      },
      {
        name: 'Pull (drag)',
        nameKey: 'prog.day.pull',
        exercises: [e('Marklyft', 3, '5', 150), e('Pull-ups', 4, '6-10'), e('Skivstångsrodd', 3, '8-10'), e('Face pulls', 3, '15', 60), e('Bicepscurl', 3, '12', 60)],
      },
      {
        name: 'Ben',
        nameKey: 'prog.day.legs',
        exercises: [e('Knäböj', 4, '6-8', 150), e('Rumänsk marklyft', 3, '8-10'), e('Benpress', 3, '10-12'), e('Bencurl', 3, '12-15', 60), e('Vadpress', 4, '15-20', 45)],
      },
    ],
  },
  {
    id: 'ol-ul-4',
    name: 'Överkropp / Underkropp',
    nameKey: 'prog.upperLower.name',
    description: 'Fyra pass i veckan uppdelat på över- och underkropp. Bra balans mellan volym och återhämtning.',
    descKey: 'prog.upperLower.desc',
    level: 'Medel–Avancerad',
    days_per_week: 4,
    days: [
      {
        name: 'Överkropp A',
        nameKey: 'prog.day.upperA',
        exercises: [e('Bänkpress', 4, '6-8', 120), e('Skivstångsrodd', 4, '8-10'), e('Axelpress', 3, '8-10'), e('Latsdrag', 3, '10-12'), e('Bicepscurl', 3, '12', 60)],
      },
      {
        name: 'Underkropp A',
        nameKey: 'prog.day.lowerA',
        exercises: [e('Knäböj', 4, '6-8', 150), e('Rumänsk marklyft', 3, '8-10'), e('Utfallssteg', 3, '10/ben'), e('Vadpress', 4, '15', 45), e('Plankan', 3, '60 s', 60)],
      },
      {
        name: 'Överkropp B',
        nameKey: 'prog.day.upperB',
        exercises: [e('Hantelpress', 4, '8-10'), e('Pull-ups', 4, 'Max'), e('Lutande bänkpress', 3, '10-12'), e('Face pulls', 3, '15', 60), e('Tricepsdips', 3, 'Max', 60)],
      },
      {
        name: 'Underkropp B',
        nameKey: 'prog.day.lowerB',
        exercises: [e('Marklyft', 4, '5', 150), e('Benpress', 4, '10-12'), e('Bencurl', 3, '12-15', 60), e('Höftlyft', 3, '12'), e('Hängande benlyft', 3, '12-15', 60)],
      },
    ],
  },
]

/**
 * Vilken utrustning ett färdigt program kräver.
 *
 * Programmen är hårdkodade och pekar på övningar med NAMN, så utrustningen
 * måste slås upp i katalogen. Utan det visades skivstångsprogram för någon
 * som bara har hantlar — samma fel som schemagenereringen hade.
 *
 * Övningar som inte går att slå upp hoppas över i stället för att räknas som
 * kravlösa: ett program ska inte se genomförbart ut på grund av en felstavning.
 */
export function programEquipment(template: ProgramTemplate): Set<string> {
  const needed = new Set<string>()
  for (const day of template.days) {
    for (const ex of day.exercises) {
      const hit = matchExercise(ex.name)
      if (hit) needed.add(hit.equipment)
    }
  }
  return needed
}

/**
 * Utrustning programmet kräver som användaren INTE har.
 *
 * Tom mängd ⇒ programmet går att genomföra. Programmen döljs inte när något
 * saknas — alla tre kräver skivstång, kabel och maskin, så filtrering hade
 * tömt sektionen. Att visa vad som saknas säger mer än att visa ingenting.
 */
export function missingEquipment(
  template: ProgramTemplate,
  allowed: Set<string>
): string[] {
  return [...programEquipment(template)].filter((eq) => !allowed.has(eq)).sort()
}
