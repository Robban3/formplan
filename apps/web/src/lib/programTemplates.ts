// Pre-made training programs — always available, independent of any AI plan.

export interface TemplateExercise {
  name: string
  sets: number
  reps: string
  rest_seconds: number
}

export interface TemplateDay {
  name: string
  exercises: TemplateExercise[]
}

export interface ProgramTemplate {
  id: string
  name: string
  description: string
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
    description: 'Bygg styrka och muskler med tre helkroppspass i veckan. Perfekt för nybörjare och medel.',
    level: 'Nybörjare–Medel',
    days_per_week: 3,
    days: [
      {
        name: 'Pass A',
        exercises: [e('Knäböj', 3, '8-10'), e('Bänkpress', 3, '8-10'), e('Skivstångsrodd', 3, '8-10'), e('Axelpress', 3, '10-12'), e('Plankan', 3, '45 s', 60)],
      },
      {
        name: 'Pass B',
        exercises: [e('Marklyft', 3, '5-6', 120), e('Hantelpress', 3, '8-10'), e('Latsdrag', 3, '10-12'), e('Utfallssteg', 3, '10/ben'), e('Hängande benlyft', 3, '12-15', 60)],
      },
      {
        name: 'Pass C',
        exercises: [e('Frontböj', 3, '8-10'), e('Pull-ups', 3, 'Max'), e('Lutande bänkpress', 3, '8-10'), e('Sidolyft', 3, '12-15', 60), e('Sit-ups', 3, '15-20', 60)],
      },
    ],
  },
  {
    id: 'ppl-3',
    name: 'Push / Pull / Ben',
    description: 'Klassisk uppdelning på tryck, drag och ben. För dig som vill träna 3–6 dagar i veckan.',
    level: 'Medel',
    days_per_week: 3,
    days: [
      {
        name: 'Push (tryck)',
        exercises: [e('Bänkpress', 4, '6-8', 120), e('Axelpress', 3, '8-10'), e('Lutande bänkpress', 3, '10-12'), e('Sidolyft', 3, '12-15', 60), e('Tricepspress', 3, '12-15', 60)],
      },
      {
        name: 'Pull (drag)',
        exercises: [e('Marklyft', 3, '5', 150), e('Pull-ups', 4, '6-10'), e('Skivstångsrodd', 3, '8-10'), e('Face pulls', 3, '15', 60), e('Bicepscurl', 3, '12', 60)],
      },
      {
        name: 'Ben',
        exercises: [e('Knäböj', 4, '6-8', 150), e('Rumänsk marklyft', 3, '8-10'), e('Benpress', 3, '10-12'), e('Bencurl', 3, '12-15', 60), e('Vadpress', 4, '15-20', 45)],
      },
    ],
  },
  {
    id: 'ol-ul-4',
    name: 'Överkropp / Underkropp',
    description: 'Fyra pass i veckan uppdelat på över- och underkropp. Bra balans mellan volym och återhämtning.',
    level: 'Medel–Avancerad',
    days_per_week: 4,
    days: [
      {
        name: 'Överkropp A',
        exercises: [e('Bänkpress', 4, '6-8', 120), e('Skivstångsrodd', 4, '8-10'), e('Axelpress', 3, '8-10'), e('Latsdrag', 3, '10-12'), e('Bicepscurl', 3, '12', 60)],
      },
      {
        name: 'Underkropp A',
        exercises: [e('Knäböj', 4, '6-8', 150), e('Rumänsk marklyft', 3, '8-10'), e('Utfallssteg', 3, '10/ben'), e('Vadpress', 4, '15', 45), e('Plankan', 3, '60 s', 60)],
      },
      {
        name: 'Överkropp B',
        exercises: [e('Hantelpress', 4, '8-10'), e('Pull-ups', 4, 'Max'), e('Lutande bänkpress', 3, '10-12'), e('Face pulls', 3, '15', 60), e('Tricepsdips', 3, 'Max', 60)],
      },
      {
        name: 'Underkropp B',
        exercises: [e('Marklyft', 4, '5', 150), e('Benpress', 4, '10-12'), e('Bencurl', 3, '12-15', 60), e('Höftlyft', 3, '12'), e('Hängande benlyft', 3, '12-15', 60)],
      },
    ],
  },
]
