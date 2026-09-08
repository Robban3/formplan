// GENERERAD FIL — ändra inte för hand.
// Kör `node scripts/build-exercise-catalog.mjs` för att bygga om.
//
// Källa: free-exercise-db (MIT). Bilderna är nedladdade och optimerade till
// apps/web/public/exercises/, så appen är oberoende av externa värdar och
// fungerar offline i native-appen.

export const MUSCLES = [
  'abdominals', 'abductors', 'adductors', 'biceps', 'calves', 'chest', 'forearms',
  'glutes', 'hamstrings', 'lats', 'lower back', 'middle back', 'neck',
  'quadriceps', 'shoulders', 'traps', 'triceps',
] as const
export type Muscle = (typeof MUSCLES)[number]

/** Svenska namn för muskelgrupperna (för muskelkartans etiketter). */
export const MUSCLE_LABELS: Record<Muscle, string> = {
  abdominals: 'Mage', abductors: 'Höftabduktorer', adductors: 'Höftadduktorer',
  biceps: 'Biceps', calves: 'Vader', chest: 'Bröst', forearms: 'Underarmar',
  glutes: 'Säte', hamstrings: 'Baksida lår', lats: 'Latissimus',
  'lower back': 'Ländrygg', 'middle back': 'Mellanrygg', neck: 'Nacke',
  quadriceps: 'Framsida lår', shoulders: 'Axlar', traps: 'Kappmuskel', triceps: 'Triceps',
}

export const EXERCISE_CATEGORIES = ['Bröst', 'Rygg', 'Ben', 'Axlar', 'Armar', 'Core', 'Kondition'] as const
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number]

export interface CatalogExercise {
  /** Stabilt id — används i scheman, historik och progression. */
  id: string
  name: string
  category: ExerciseCategory
  equipment: string
  primaryMuscles: Muscle[]
  secondaryMuscles: Muscle[]
  /** [startläge, slutläge] — växlas i UI:t för att visa rörelsen. */
  images: [string, string]
  /** Varianter som AI:n eller äldre scheman kan ha skrivit. */
  aliases: string[]
}

export const EXERCISE_CATALOG: CatalogExercise[] = [
  {
    "id": "bankpress",
    "name": "Bänkpress",
    "category": "Bröst",
    "equipment": "barbell",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "shoulders",
      "triceps"
    ],
    "images": [
      "/exercises/bankpress-0.webp",
      "/exercises/bankpress-1.webp"
    ],
    "aliases": [
      "bänkpress med skivstång",
      "bench press",
      "flatbänk"
    ]
  },
  {
    "id": "hantelpress-brost",
    "name": "Hantelpress",
    "category": "Bröst",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "shoulders",
      "triceps"
    ],
    "images": [
      "/exercises/hantelpress-brost-0.webp",
      "/exercises/hantelpress-brost-1.webp"
    ],
    "aliases": [
      "hantelbänkpress",
      "dumbbell press"
    ]
  },
  {
    "id": "lutande-bankpress",
    "name": "Lutande bänkpress",
    "category": "Bröst",
    "equipment": "barbell",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "shoulders",
      "triceps"
    ],
    "images": [
      "/exercises/lutande-bankpress-0.webp",
      "/exercises/lutande-bankpress-1.webp"
    ],
    "aliases": [
      "incline bench press",
      "snedbänk",
      "sned bänkpress"
    ]
  },
  {
    "id": "lutande-hantelpress",
    "name": "Lutande hantelpress",
    "category": "Bröst",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "shoulders",
      "triceps"
    ],
    "images": [
      "/exercises/lutande-hantelpress-0.webp",
      "/exercises/lutande-hantelpress-1.webp"
    ],
    "aliases": [
      "incline dumbbell press"
    ]
  },
  {
    "id": "armhavningar",
    "name": "Armhävningar",
    "category": "Bröst",
    "equipment": "body only",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "shoulders",
      "triceps"
    ],
    "images": [
      "/exercises/armhavningar-0.webp",
      "/exercises/armhavningar-1.webp"
    ],
    "aliases": [
      "push-ups",
      "pushups",
      "armhävning"
    ]
  },
  {
    "id": "flyes",
    "name": "Flyes",
    "category": "Bröst",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/flyes-0.webp",
      "/exercises/flyes-1.webp"
    ],
    "aliases": [
      "hantelflyes",
      "flys"
    ]
  },
  {
    "id": "pec-deck",
    "name": "Pec deck",
    "category": "Bröst",
    "equipment": "machine",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/pec-deck-0.webp",
      "/exercises/pec-deck-1.webp"
    ],
    "aliases": [
      "butterfly",
      "maskinflyes"
    ]
  },
  {
    "id": "maskinpress-brost",
    "name": "Maskinpress bröst",
    "category": "Bröst",
    "equipment": "machine",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "shoulders",
      "triceps"
    ],
    "images": [
      "/exercises/maskinpress-brost-0.webp",
      "/exercises/maskinpress-brost-1.webp"
    ],
    "aliases": [
      "bröstpress maskin"
    ]
  },
  {
    "id": "dips-brost",
    "name": "Dips",
    "category": "Bröst",
    "equipment": "other",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "shoulders",
      "triceps"
    ],
    "images": [
      "/exercises/dips-brost-0.webp",
      "/exercises/dips-brost-1.webp"
    ],
    "aliases": [
      "dips bröst"
    ]
  },
  {
    "id": "kabelcross",
    "name": "Kabelcross",
    "category": "Bröst",
    "equipment": "cable",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "shoulders"
    ],
    "images": [
      "/exercises/kabelcross-0.webp",
      "/exercises/kabelcross-1.webp"
    ],
    "aliases": [
      "cable crossover",
      "kabelkryss"
    ]
  },
  {
    "id": "marklyft",
    "name": "Marklyft",
    "category": "Rygg",
    "equipment": "barbell",
    "primaryMuscles": [
      "lower back"
    ],
    "secondaryMuscles": [
      "calves",
      "forearms",
      "glutes",
      "hamstrings",
      "lats",
      "middle back",
      "quadriceps",
      "traps"
    ],
    "images": [
      "/exercises/marklyft-0.webp",
      "/exercises/marklyft-1.webp"
    ],
    "aliases": [
      "deadlift",
      "konventionell marklyft"
    ]
  },
  {
    "id": "pull-ups",
    "name": "Pull-ups",
    "category": "Rygg",
    "equipment": "body only",
    "primaryMuscles": [
      "lats"
    ],
    "secondaryMuscles": [
      "biceps",
      "middle back"
    ],
    "images": [
      "/exercises/pull-ups-0.webp",
      "/exercises/pull-ups-1.webp"
    ],
    "aliases": [
      "pullups",
      "räckhäv"
    ]
  },
  {
    "id": "chins",
    "name": "Chins",
    "category": "Rygg",
    "equipment": "body only",
    "primaryMuscles": [
      "lats"
    ],
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "middle back"
    ],
    "images": [
      "/exercises/chins-0.webp",
      "/exercises/chins-1.webp"
    ],
    "aliases": [
      "chin-up",
      "chinups"
    ]
  },
  {
    "id": "latsdrag",
    "name": "Latsdrag",
    "category": "Rygg",
    "equipment": "cable",
    "primaryMuscles": [
      "lats"
    ],
    "secondaryMuscles": [
      "biceps",
      "middle back",
      "shoulders"
    ],
    "images": [
      "/exercises/latsdrag-0.webp",
      "/exercises/latsdrag-1.webp"
    ],
    "aliases": [
      "lat pulldown",
      "latsdrag brett grepp"
    ]
  },
  {
    "id": "skivstangsrodd",
    "name": "Skivstångsrodd",
    "category": "Rygg",
    "equipment": "barbell",
    "primaryMuscles": [
      "middle back"
    ],
    "secondaryMuscles": [
      "biceps",
      "lats",
      "shoulders"
    ],
    "images": [
      "/exercises/skivstangsrodd-0.webp",
      "/exercises/skivstangsrodd-1.webp"
    ],
    "aliases": [
      "stångrodd",
      "barbell row",
      "framåtböjd rodd",
      "rodd med skivstång"
    ]
  },
  {
    "id": "hantelrodd",
    "name": "Hantelrodd",
    "category": "Rygg",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "middle back"
    ],
    "secondaryMuscles": [
      "biceps",
      "lats",
      "shoulders"
    ],
    "images": [
      "/exercises/hantelrodd-0.webp",
      "/exercises/hantelrodd-1.webp"
    ],
    "aliases": [
      "enarmsrodd",
      "dumbbell row"
    ]
  },
  {
    "id": "sittande-kabelrodd",
    "name": "Sittande kabelrodd",
    "category": "Rygg",
    "equipment": "cable",
    "primaryMuscles": [
      "middle back"
    ],
    "secondaryMuscles": [
      "biceps",
      "lats",
      "shoulders"
    ],
    "images": [
      "/exercises/sittande-kabelrodd-0.webp",
      "/exercises/sittande-kabelrodd-1.webp"
    ],
    "aliases": [
      "kabelrodd",
      "seated row",
      "sittande rodd"
    ]
  },
  {
    "id": "t-bar-rodd",
    "name": "T-bar rodd",
    "category": "Rygg",
    "equipment": "machine",
    "primaryMuscles": [
      "middle back"
    ],
    "secondaryMuscles": [
      "biceps",
      "lats"
    ],
    "images": [
      "/exercises/t-bar-rodd-0.webp",
      "/exercises/t-bar-rodd-1.webp"
    ],
    "aliases": [
      "t-bar row",
      "tbar rodd"
    ]
  },
  {
    "id": "pullover",
    "name": "Pullover",
    "category": "Rygg",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "lats",
      "shoulders",
      "triceps"
    ],
    "images": [
      "/exercises/pullover-0.webp",
      "/exercises/pullover-1.webp"
    ],
    "aliases": [
      "hantelpullover"
    ]
  },
  {
    "id": "rygglyft",
    "name": "Rygglyft",
    "category": "Rygg",
    "equipment": "other",
    "primaryMuscles": [
      "lower back"
    ],
    "secondaryMuscles": [
      "glutes",
      "hamstrings"
    ],
    "images": [
      "/exercises/rygglyft-0.webp",
      "/exercises/rygglyft-1.webp"
    ],
    "aliases": [
      "ryggresning",
      "back extension",
      "hyperextension"
    ]
  },
  {
    "id": "shrugs",
    "name": "Shrugs",
    "category": "Rygg",
    "equipment": "barbell",
    "primaryMuscles": [
      "traps"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/shrugs-0.webp",
      "/exercises/shrugs-1.webp"
    ],
    "aliases": [
      "axelryckningar",
      "shrug"
    ]
  },
  {
    "id": "knaboj",
    "name": "Knäböj",
    "category": "Ben",
    "equipment": "barbell",
    "primaryMuscles": [
      "quadriceps"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings",
      "lower back"
    ],
    "images": [
      "/exercises/knaboj-0.webp",
      "/exercises/knaboj-1.webp"
    ],
    "aliases": [
      "squat",
      "benböj",
      "knäböj med skivstång"
    ]
  },
  {
    "id": "frontboj",
    "name": "Frontböj",
    "category": "Ben",
    "equipment": "barbell",
    "primaryMuscles": [
      "quadriceps"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings"
    ],
    "images": [
      "/exercises/frontboj-0.webp",
      "/exercises/frontboj-1.webp"
    ],
    "aliases": [
      "front squat",
      "frontknäböj"
    ]
  },
  {
    "id": "goblet-squat",
    "name": "Goblet squat",
    "category": "Ben",
    "equipment": "kettlebells",
    "primaryMuscles": [
      "quadriceps"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings",
      "shoulders"
    ],
    "images": [
      "/exercises/goblet-squat-0.webp",
      "/exercises/goblet-squat-1.webp"
    ],
    "aliases": [
      "gobletsquat"
    ]
  },
  {
    "id": "benpress",
    "name": "Benpress",
    "category": "Ben",
    "equipment": "machine",
    "primaryMuscles": [
      "quadriceps"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings"
    ],
    "images": [
      "/exercises/benpress-0.webp",
      "/exercises/benpress-1.webp"
    ],
    "aliases": [
      "leg press"
    ]
  },
  {
    "id": "utfallssteg",
    "name": "Utfallssteg",
    "category": "Ben",
    "equipment": "barbell",
    "primaryMuscles": [
      "quadriceps"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings"
    ],
    "images": [
      "/exercises/utfallssteg-0.webp",
      "/exercises/utfallssteg-1.webp"
    ],
    "aliases": [
      "utfall",
      "lunges",
      "lunge"
    ]
  },
  {
    "id": "bulgarisk-split-squat",
    "name": "Bulgarisk split squat",
    "category": "Ben",
    "equipment": "other",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "quadriceps"
    ],
    "images": [
      "/exercises/bulgarisk-split-squat-0.webp",
      "/exercises/bulgarisk-split-squat-1.webp"
    ],
    "aliases": [
      "split squat",
      "bulgarian split squat"
    ]
  },
  {
    "id": "step-up",
    "name": "Step-up",
    "category": "Ben",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "quadriceps"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings"
    ],
    "images": [
      "/exercises/step-up-0.webp",
      "/exercises/step-up-1.webp"
    ],
    "aliases": [
      "stepup",
      "uppsteg"
    ]
  },
  {
    "id": "rumansk-marklyft",
    "name": "Rumänsk marklyft",
    "category": "Ben",
    "equipment": "barbell",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "lower back"
    ],
    "images": [
      "/exercises/rumansk-marklyft-0.webp",
      "/exercises/rumansk-marklyft-1.webp"
    ],
    "aliases": [
      "rdl",
      "romanian deadlift",
      "raka marklyft"
    ]
  },
  {
    "id": "good-morning",
    "name": "Good morning",
    "category": "Ben",
    "equipment": "barbell",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "abdominals",
      "glutes",
      "lower back"
    ],
    "images": [
      "/exercises/good-morning-0.webp",
      "/exercises/good-morning-1.webp"
    ],
    "aliases": [
      "goodmorning"
    ]
  },
  {
    "id": "bencurl",
    "name": "Bencurl",
    "category": "Ben",
    "equipment": "machine",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/bencurl-0.webp",
      "/exercises/bencurl-1.webp"
    ],
    "aliases": [
      "lårcurl",
      "leg curl",
      "liggande bencurl"
    ]
  },
  {
    "id": "benspark",
    "name": "Benspark",
    "category": "Ben",
    "equipment": "machine",
    "primaryMuscles": [
      "quadriceps"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/benspark-0.webp",
      "/exercises/benspark-1.webp"
    ],
    "aliases": [
      "leg extension",
      "lårspark"
    ]
  },
  {
    "id": "hoftlyft",
    "name": "Höftlyft",
    "category": "Ben",
    "equipment": "barbell",
    "primaryMuscles": [
      "glutes"
    ],
    "secondaryMuscles": [
      "calves",
      "hamstrings"
    ],
    "images": [
      "/exercises/hoftlyft-0.webp",
      "/exercises/hoftlyft-1.webp"
    ],
    "aliases": [
      "glute bridge",
      "bäckenlyft"
    ]
  },
  {
    "id": "hip-thrust",
    "name": "Hip thrust",
    "category": "Ben",
    "equipment": "barbell",
    "primaryMuscles": [
      "glutes"
    ],
    "secondaryMuscles": [
      "calves",
      "hamstrings"
    ],
    "images": [
      "/exercises/hip-thrust-0.webp",
      "/exercises/hip-thrust-1.webp"
    ],
    "aliases": [
      "höftstöt",
      "hipthrust"
    ]
  },
  {
    "id": "hoftadduktion",
    "name": "Höftadduktion",
    "category": "Ben",
    "equipment": "cable",
    "primaryMuscles": [
      "quadriceps"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/hoftadduktion-0.webp",
      "/exercises/hoftadduktion-1.webp"
    ],
    "aliases": [
      "adduktion",
      "inåtföring lår"
    ]
  },
  {
    "id": "vadpress-staende",
    "name": "Vadpress",
    "category": "Ben",
    "equipment": "machine",
    "primaryMuscles": [
      "calves"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/vadpress-staende-0.webp",
      "/exercises/vadpress-staende-1.webp"
    ],
    "aliases": [
      "vadpress",
      "stående vadpress",
      "calf raise",
      "tåhävningar"
    ]
  },
  {
    "id": "vadpress-sittande",
    "name": "Sittande vadpress",
    "category": "Ben",
    "equipment": "machine",
    "primaryMuscles": [
      "calves"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/vadpress-sittande-0.webp",
      "/exercises/vadpress-sittande-1.webp"
    ],
    "aliases": [
      "seated calf raise"
    ]
  },
  {
    "id": "box-jump",
    "name": "Box jump",
    "category": "Ben",
    "equipment": "other",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "abductors",
      "adductors",
      "calves",
      "glutes",
      "quadriceps"
    ],
    "images": [
      "/exercises/box-jump-0.webp",
      "/exercises/box-jump-1.webp"
    ],
    "aliases": [
      "boxhopp",
      "lådhopp"
    ]
  },
  {
    "id": "axelpress",
    "name": "Axelpress",
    "category": "Axlar",
    "equipment": "barbell",
    "primaryMuscles": [
      "shoulders"
    ],
    "secondaryMuscles": [
      "chest",
      "triceps"
    ],
    "images": [
      "/exercises/axelpress-0.webp",
      "/exercises/axelpress-1.webp"
    ],
    "aliases": [
      "shoulder press",
      "skivstångspress axlar"
    ]
  },
  {
    "id": "militarpress",
    "name": "Militärpress",
    "category": "Axlar",
    "equipment": "barbell",
    "primaryMuscles": [
      "shoulders"
    ],
    "secondaryMuscles": [
      "triceps"
    ],
    "images": [
      "/exercises/militarpress-0.webp",
      "/exercises/militarpress-1.webp"
    ],
    "aliases": [
      "military press",
      "stående press"
    ]
  },
  {
    "id": "hantelpress-axlar",
    "name": "Hantelpress axlar",
    "category": "Axlar",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "shoulders"
    ],
    "secondaryMuscles": [
      "triceps"
    ],
    "images": [
      "/exercises/hantelpress-axlar-0.webp",
      "/exercises/hantelpress-axlar-1.webp"
    ],
    "aliases": [
      "hantelaxelpress",
      "dumbbell shoulder press"
    ]
  },
  {
    "id": "arnoldpress",
    "name": "Arnoldpress",
    "category": "Axlar",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "shoulders"
    ],
    "secondaryMuscles": [
      "triceps"
    ],
    "images": [
      "/exercises/arnoldpress-0.webp",
      "/exercises/arnoldpress-1.webp"
    ],
    "aliases": [
      "arnold press"
    ]
  },
  {
    "id": "sidolyft",
    "name": "Sidolyft",
    "category": "Axlar",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "shoulders"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/sidolyft-0.webp",
      "/exercises/sidolyft-1.webp"
    ],
    "aliases": [
      "lateral raise",
      "sidolyft hantlar"
    ]
  },
  {
    "id": "frontlyft",
    "name": "Frontlyft",
    "category": "Axlar",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "shoulders"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/frontlyft-0.webp",
      "/exercises/frontlyft-1.webp"
    ],
    "aliases": [
      "front raise"
    ]
  },
  {
    "id": "face-pull",
    "name": "Face pulls",
    "category": "Axlar",
    "equipment": "cable",
    "primaryMuscles": [
      "shoulders"
    ],
    "secondaryMuscles": [
      "middle back"
    ],
    "images": [
      "/exercises/face-pull-0.webp",
      "/exercises/face-pull-1.webp"
    ],
    "aliases": [
      "face pull",
      "ansiktsdrag"
    ]
  },
  {
    "id": "omvand-flyes",
    "name": "Omvänd flyes",
    "category": "Axlar",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "shoulders"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/omvand-flyes-0.webp",
      "/exercises/omvand-flyes-1.webp"
    ],
    "aliases": [
      "reverse flyes",
      "omvända flyes",
      "bakre axelflyes"
    ]
  },
  {
    "id": "upright-row",
    "name": "Upright row",
    "category": "Axlar",
    "equipment": "barbell",
    "primaryMuscles": [
      "shoulders"
    ],
    "secondaryMuscles": [
      "traps"
    ],
    "images": [
      "/exercises/upright-row-0.webp",
      "/exercises/upright-row-1.webp"
    ],
    "aliases": [
      "stående rodd",
      "uprightrow"
    ]
  },
  {
    "id": "bicepscurl",
    "name": "Bicepscurl",
    "category": "Armar",
    "equipment": "barbell",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "images": [
      "/exercises/bicepscurl-0.webp",
      "/exercises/bicepscurl-1.webp"
    ],
    "aliases": [
      "biceps curl",
      "skivstångscurl",
      "curl"
    ]
  },
  {
    "id": "hammarcurl",
    "name": "Hammarcurl",
    "category": "Armar",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/hammarcurl-0.webp",
      "/exercises/hammarcurl-1.webp"
    ],
    "aliases": [
      "hammer curl"
    ]
  },
  {
    "id": "preacher-curl",
    "name": "Preacher curl",
    "category": "Armar",
    "equipment": "barbell",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/preacher-curl-0.webp",
      "/exercises/preacher-curl-1.webp"
    ],
    "aliases": [
      "scottcurl",
      "preachercurl"
    ]
  },
  {
    "id": "koncentrationscurl",
    "name": "Koncentrationscurl",
    "category": "Armar",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "images": [
      "/exercises/koncentrationscurl-0.webp",
      "/exercises/koncentrationscurl-1.webp"
    ],
    "aliases": [
      "concentration curl"
    ]
  },
  {
    "id": "kabelcurl",
    "name": "Kabelcurl",
    "category": "Armar",
    "equipment": "cable",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/kabelcurl-0.webp",
      "/exercises/kabelcurl-1.webp"
    ],
    "aliases": [
      "cable curl"
    ]
  },
  {
    "id": "reverse-curl",
    "name": "Omvänd curl",
    "category": "Armar",
    "equipment": "barbell",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "images": [
      "/exercises/reverse-curl-0.webp",
      "/exercises/reverse-curl-1.webp"
    ],
    "aliases": [
      "reverse curl",
      "omvänd bicepscurl"
    ]
  },
  {
    "id": "tricepspress",
    "name": "Tricepspress",
    "category": "Armar",
    "equipment": "cable",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/tricepspress-0.webp",
      "/exercises/tricepspress-1.webp"
    ],
    "aliases": [
      "triceps pushdown",
      "tricepsnedpress"
    ]
  },
  {
    "id": "repdrag-triceps",
    "name": "Repdrag triceps",
    "category": "Armar",
    "equipment": "cable",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/repdrag-triceps-0.webp",
      "/exercises/repdrag-triceps-1.webp"
    ],
    "aliases": [
      "rope pushdown",
      "tricepsrep"
    ]
  },
  {
    "id": "tricepsextension",
    "name": "Tricepsextension över huvud",
    "category": "Armar",
    "equipment": "cable",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/tricepsextension-0.webp",
      "/exercises/tricepsextension-1.webp"
    ],
    "aliases": [
      "overhead extension",
      "fransk press"
    ]
  },
  {
    "id": "skullcrushers",
    "name": "Skullcrushers",
    "category": "Armar",
    "equipment": "e-z curl bar",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/skullcrushers-0.webp",
      "/exercises/skullcrushers-1.webp"
    ],
    "aliases": [
      "skullcrusher",
      "liggande tricepspress"
    ]
  },
  {
    "id": "tricepsdips",
    "name": "Tricepsdips",
    "category": "Armar",
    "equipment": "body only",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "chest",
      "shoulders"
    ],
    "images": [
      "/exercises/tricepsdips-0.webp",
      "/exercises/tricepsdips-1.webp"
    ],
    "aliases": [
      "bench dips",
      "bänkdips",
      "triceps dips"
    ]
  },
  {
    "id": "plankan",
    "name": "Plankan",
    "category": "Core",
    "equipment": "body only",
    "primaryMuscles": [
      "abdominals"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/plankan-0.webp",
      "/exercises/plankan-1.webp"
    ],
    "aliases": [
      "planka",
      "plank"
    ]
  },
  {
    "id": "sidoplanka",
    "name": "Sidoplanka",
    "category": "Core",
    "equipment": "body only",
    "primaryMuscles": [
      "abdominals"
    ],
    "secondaryMuscles": [
      "shoulders"
    ],
    "images": [
      "/exercises/sidoplanka-0.webp",
      "/exercises/sidoplanka-1.webp"
    ],
    "aliases": [
      "side plank",
      "sidplanka"
    ]
  },
  {
    "id": "sit-ups",
    "name": "Sit-ups",
    "category": "Core",
    "equipment": "body only",
    "primaryMuscles": [
      "abdominals"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/sit-ups-0.webp",
      "/exercises/sit-ups-1.webp"
    ],
    "aliases": [
      "situps",
      "magböj"
    ]
  },
  {
    "id": "crunches",
    "name": "Crunches",
    "category": "Core",
    "equipment": "body only",
    "primaryMuscles": [
      "abdominals"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/crunches-0.webp",
      "/exercises/crunches-1.webp"
    ],
    "aliases": [
      "crunch",
      "magcrunch"
    ]
  },
  {
    "id": "cykelcrunch",
    "name": "Cykelcrunch",
    "category": "Core",
    "equipment": "body only",
    "primaryMuscles": [
      "abdominals"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/cykelcrunch-0.webp",
      "/exercises/cykelcrunch-1.webp"
    ],
    "aliases": [
      "bicycle crunch",
      "cykelmage"
    ]
  },
  {
    "id": "russian-twist",
    "name": "Russian twist",
    "category": "Core",
    "equipment": "body only",
    "primaryMuscles": [
      "abdominals"
    ],
    "secondaryMuscles": [
      "lower back"
    ],
    "images": [
      "/exercises/russian-twist-0.webp",
      "/exercises/russian-twist-1.webp"
    ],
    "aliases": [
      "rysk twist"
    ]
  },
  {
    "id": "hangande-benlyft",
    "name": "Hängande benlyft",
    "category": "Core",
    "equipment": "body only",
    "primaryMuscles": [
      "abdominals"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/hangande-benlyft-0.webp",
      "/exercises/hangande-benlyft-1.webp"
    ],
    "aliases": [
      "hanging leg raise"
    ]
  },
  {
    "id": "benlyft-liggande",
    "name": "Liggande benlyft",
    "category": "Core",
    "equipment": "body only",
    "primaryMuscles": [
      "abdominals"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/benlyft-liggande-0.webp",
      "/exercises/benlyft-liggande-1.webp"
    ],
    "aliases": [
      "lying leg raise",
      "benlyft"
    ]
  },
  {
    "id": "mountain-climbers",
    "name": "Mountain climbers",
    "category": "Core",
    "equipment": "other",
    "primaryMuscles": [
      "quadriceps"
    ],
    "secondaryMuscles": [
      "chest",
      "hamstrings",
      "shoulders"
    ],
    "images": [
      "/exercises/mountain-climbers-0.webp",
      "/exercises/mountain-climbers-1.webp"
    ],
    "aliases": [
      "bergsklättrare"
    ]
  },
  {
    "id": "dead-bug",
    "name": "Dead bug",
    "category": "Core",
    "equipment": "body only",
    "primaryMuscles": [
      "abdominals"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/dead-bug-0.webp",
      "/exercises/dead-bug-1.webp"
    ],
    "aliases": [
      "deadbug"
    ]
  },
  {
    "id": "ab-wheel",
    "name": "Ab wheel",
    "category": "Core",
    "equipment": "other",
    "primaryMuscles": [
      "abdominals"
    ],
    "secondaryMuscles": [
      "shoulders"
    ],
    "images": [
      "/exercises/ab-wheel-0.webp",
      "/exercises/ab-wheel-1.webp"
    ],
    "aliases": [
      "maghjul",
      "ab roller"
    ]
  },
  {
    "id": "sidoboj",
    "name": "Sidoböj",
    "category": "Core",
    "equipment": "dumbbell",
    "primaryMuscles": [
      "abdominals"
    ],
    "secondaryMuscles": [],
    "images": [
      "/exercises/sidoboj-0.webp",
      "/exercises/sidoboj-1.webp"
    ],
    "aliases": [
      "side bend"
    ]
  },
  {
    "id": "superman",
    "name": "Superman",
    "category": "Core",
    "equipment": "body only",
    "primaryMuscles": [
      "lower back"
    ],
    "secondaryMuscles": [
      "glutes",
      "hamstrings"
    ],
    "images": [
      "/exercises/superman-0.webp",
      "/exercises/superman-1.webp"
    ],
    "aliases": [
      "ryggresning golv"
    ]
  },
  {
    "id": "lopning",
    "name": "Löpning",
    "category": "Kondition",
    "equipment": "machine",
    "primaryMuscles": [
      "quadriceps"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings"
    ],
    "images": [
      "/exercises/lopning-0.webp",
      "/exercises/lopning-1.webp"
    ],
    "aliases": [
      "löpband",
      "running",
      "löppass",
      "jogging"
    ]
  },
  {
    "id": "gang",
    "name": "Gång",
    "category": "Kondition",
    "equipment": "machine",
    "primaryMuscles": [
      "quadriceps"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings"
    ],
    "images": [
      "/exercises/gang-0.webp",
      "/exercises/gang-1.webp"
    ],
    "aliases": [
      "promenad",
      "walking"
    ]
  },
  {
    "id": "cykling",
    "name": "Cykling",
    "category": "Kondition",
    "equipment": "other",
    "primaryMuscles": [
      "quadriceps"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings"
    ],
    "images": [
      "/exercises/cykling-0.webp",
      "/exercises/cykling-1.webp"
    ],
    "aliases": [
      "cykel",
      "spinning",
      "bike"
    ]
  },
  {
    "id": "roddmaskin",
    "name": "Roddmaskin",
    "category": "Kondition",
    "equipment": "machine",
    "primaryMuscles": [
      "quadriceps"
    ],
    "secondaryMuscles": [
      "biceps",
      "calves",
      "glutes",
      "hamstrings",
      "lower back",
      "middle back"
    ],
    "images": [
      "/exercises/roddmaskin-0.webp",
      "/exercises/roddmaskin-1.webp"
    ],
    "aliases": [
      "rodd",
      "rowing"
    ]
  },
  {
    "id": "crosstrainer",
    "name": "Crosstrainer",
    "category": "Kondition",
    "equipment": "machine",
    "primaryMuscles": [
      "quadriceps"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings"
    ],
    "images": [
      "/exercises/crosstrainer-0.webp",
      "/exercises/crosstrainer-1.webp"
    ],
    "aliases": [
      "elliptical"
    ]
  },
  {
    "id": "stairmaster",
    "name": "Stairmaster",
    "category": "Kondition",
    "equipment": "machine",
    "primaryMuscles": [
      "quadriceps"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings"
    ],
    "images": [
      "/exercises/stairmaster-0.webp",
      "/exercises/stairmaster-1.webp"
    ],
    "aliases": [
      "trappmaskin"
    ]
  },
  {
    "id": "hopprep",
    "name": "Hopprep",
    "category": "Kondition",
    "equipment": "other",
    "primaryMuscles": [
      "quadriceps"
    ],
    "secondaryMuscles": [
      "calves",
      "hamstrings"
    ],
    "images": [
      "/exercises/hopprep-0.webp",
      "/exercises/hopprep-1.webp"
    ],
    "aliases": [
      "hoppa rep",
      "jump rope"
    ]
  },
  {
    "id": "kettlebell-swing",
    "name": "Kettlebell swing",
    "category": "Kondition",
    "equipment": "kettlebells",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "lower back",
      "shoulders"
    ],
    "images": [
      "/exercises/kettlebell-swing-0.webp",
      "/exercises/kettlebell-swing-1.webp"
    ],
    "aliases": [
      "kb swing",
      "kettlebellsving"
    ]
  },
  {
    "id": "battle-ropes",
    "name": "Battle ropes",
    "category": "Kondition",
    "equipment": "other",
    "primaryMuscles": [
      "shoulders"
    ],
    "secondaryMuscles": [
      "chest",
      "forearms"
    ],
    "images": [
      "/exercises/battle-ropes-0.webp",
      "/exercises/battle-ropes-1.webp"
    ],
    "aliases": [
      "kamprep"
    ]
  }
]

const BY_ID = new Map(EXERCISE_CATALOG.map((e) => [e.id, e]))

/** Slår upp en katalogövning på id. */
export function getExerciseById(id: string): CatalogExercise | undefined {
  return BY_ID.get(id)
}

function normalize(s: string): string {
  // NFD + borttagna kombinerande tecken gör att dekomponerade â/ä/ö (som iOS
  // och vissa tangentbord producerar) normaliseras likadant som precomponerade.
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const BY_NAME = new Map<string, CatalogExercise>()
for (const e of EXERCISE_CATALOG) {
  // Id:t registreras som egen nyckel så matchExercise(id) === id alltid gäller.
  // Utan det blir historik-migreringen icke-idempotent: en omkörning skulle
  // flytta serier till fel övning och dubbelräkna volym.
  BY_NAME.set(normalize(e.id), e)
  BY_NAME.set(normalize(e.name), e)
  for (const a of e.aliases) BY_NAME.set(normalize(a), e)
}

/** Ord som inte bär betydelse när övningsnamn jämförs. */
const STOPWORDS = new Set(['med', 'och', 'pa', 'i', 'for', 'till', 'av', 'the', 'with'])

function significantTokens(tokens: string[]): string[] {
  return tokens.filter((t) => t.length >= 4 && !STOPWORDS.has(t))
}

/**
 * Mappar ett fritextnamn (från AI, egna pass eller äldre scheman) till en
 * katalogövning. Exakt namn/alias först, därefter en STRIKT tokenmatchning:
 * varje ord i nyckeln måste finnas som eget ord i namnet, OCH nyckeln måste
 * täcka namnets alla betydelsebärande ord. Returnerar hellre undefined än en
 * gissning — ingen bild är bättre än fel bild.
 *
 * Ersätter en delsträngsmatchning som kunde mappa "Sittande rodd" till
 * roddmaskinen, "Sned bänkpress" till plan bänkpress, och — allvarligast —
 * allt som normaliserade till tomt (emoji, icke-latinsk skrift, interpunktion)
 * till katalogens längsta nyckel.
 */
export function matchExercise(name: string): CatalogExercise | undefined {
  const n = normalize(name)
  // Exakt namn/alias först — korta alias (t.ex. "rdl") måste fortfarande fungera.
  const exact = BY_NAME.get(n)
  if (exact) return exact
  // Längdspärren skyddar bara den luddiga matchningen nedan.
  if (n.length < 4) return undefined

  const nameTokens = n.split(' ').filter(Boolean)
  const mustCover = significantTokens(nameTokens)

  let best: CatalogExercise | undefined
  let bestLen = 0
  for (const [key, ex] of BY_NAME) {
    if (key.length < 4) continue
    const keyTokens = key.split(' ').filter(Boolean)
    if (!keyTokens.every((t) => nameTokens.includes(t))) continue
    if (!mustCover.every((t) => keyTokens.includes(t))) continue
    if (key.length > bestLen) {
      best = ex
      bestLen = key.length
    }
  }
  return best
}
