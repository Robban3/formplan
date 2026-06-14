// Standalone exercise library — always available, independent of any AI plan.

export interface LibraryExercise {
  name: string
  category: ExerciseCategory
}

export const EXERCISE_CATEGORIES = [
  'Bröst',
  'Rygg',
  'Ben',
  'Axlar',
  'Armar',
  'Core',
  'Kondition',
] as const

export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number]

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Bröst
  { name: 'Bänkpress', category: 'Bröst' },
  { name: 'Hantelpress', category: 'Bröst' },
  { name: 'Lutande bänkpress', category: 'Bröst' },
  { name: 'Armhävningar', category: 'Bröst' },
  { name: 'Flyes', category: 'Bröst' },
  { name: 'Dips', category: 'Bröst' },
  { name: 'Kabelcross', category: 'Bröst' },

  // Rygg
  { name: 'Marklyft', category: 'Rygg' },
  { name: 'Pull-ups', category: 'Rygg' },
  { name: 'Latsdrag', category: 'Rygg' },
  { name: 'Skivstångsrodd', category: 'Rygg' },
  { name: 'Hantelrodd', category: 'Rygg' },
  { name: 'Sittande kabelrodd', category: 'Rygg' },
  { name: 'Rygglyft', category: 'Rygg' },

  // Ben
  { name: 'Knäböj', category: 'Ben' },
  { name: 'Frontböj', category: 'Ben' },
  { name: 'Benpress', category: 'Ben' },
  { name: 'Utfallssteg', category: 'Ben' },
  { name: 'Rumänsk marklyft', category: 'Ben' },
  { name: 'Bencurl', category: 'Ben' },
  { name: 'Benspark', category: 'Ben' },
  { name: 'Vadpress', category: 'Ben' },
  { name: 'Höftlyft', category: 'Ben' },

  // Axlar
  { name: 'Axelpress', category: 'Axlar' },
  { name: 'Hantelpress axlar', category: 'Axlar' },
  { name: 'Sidolyft', category: 'Axlar' },
  { name: 'Frontlyft', category: 'Axlar' },
  { name: 'Face pulls', category: 'Axlar' },
  { name: 'Omvänd flyes', category: 'Axlar' },

  // Armar
  { name: 'Bicepscurl', category: 'Armar' },
  { name: 'Hammarcurl', category: 'Armar' },
  { name: 'Tricepspress', category: 'Armar' },
  { name: 'Tricepsdips', category: 'Armar' },
  { name: 'Skullcrushers', category: 'Armar' },
  { name: 'Kabelcurl', category: 'Armar' },

  // Core
  { name: 'Plankan', category: 'Core' },
  { name: 'Sit-ups', category: 'Core' },
  { name: 'Russian twist', category: 'Core' },
  { name: 'Hängande benlyft', category: 'Core' },
  { name: 'Mountain climbers', category: 'Core' },
  { name: 'Sidoplanka', category: 'Core' },

  // Kondition
  { name: 'Löpning', category: 'Kondition' },
  { name: 'Löpband', category: 'Kondition' },
  { name: 'Cykling', category: 'Kondition' },
  { name: 'Roddmaskin', category: 'Kondition' },
  { name: 'Crosstrainer', category: 'Kondition' },
  { name: 'Hopprep', category: 'Kondition' },
  { name: 'Burpees', category: 'Kondition' },
]
