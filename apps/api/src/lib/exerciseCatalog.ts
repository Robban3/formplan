// GENERERAD FIL — ändra inte för hand.
// Kör `node scripts/build-exercise-catalog.mjs` för att bygga om.
// Samma källa som apps/web/src/lib/exerciseCatalog.ts.

export interface ApiCatalogExercise {
  id: string
  name: string
  category: string
  equipment: string
  aliases: string[]
}

export const EXERCISE_CATALOG: ApiCatalogExercise[] = [
  {
    "id": "bankpress",
    "name": "Bänkpress",
    "category": "Bröst",
    "equipment": "barbell",
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
    "aliases": [
      "incline bench press",
      "snedbänk"
    ]
  },
  {
    "id": "lutande-hantelpress",
    "name": "Lutande hantelpress",
    "category": "Bröst",
    "equipment": "dumbbell",
    "aliases": [
      "incline dumbbell press"
    ]
  },
  {
    "id": "armhavningar",
    "name": "Armhävningar",
    "category": "Bröst",
    "equipment": "body only",
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
    "aliases": [
      "bröstpress maskin"
    ]
  },
  {
    "id": "dips-brost",
    "name": "Dips",
    "category": "Bröst",
    "equipment": "other",
    "aliases": [
      "dips bröst"
    ]
  },
  {
    "id": "kabelcross",
    "name": "Kabelcross",
    "category": "Bröst",
    "equipment": "cable",
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
    "aliases": [
      "stångrodd",
      "barbell row",
      "framåtböjd rodd"
    ]
  },
  {
    "id": "hantelrodd",
    "name": "Hantelrodd",
    "category": "Rygg",
    "equipment": "dumbbell",
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
    "aliases": [
      "kabelrodd",
      "seated row"
    ]
  },
  {
    "id": "t-bar-rodd",
    "name": "T-bar rodd",
    "category": "Rygg",
    "equipment": "machine",
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
    "aliases": [
      "hantelpullover"
    ]
  },
  {
    "id": "rygglyft",
    "name": "Rygglyft",
    "category": "Rygg",
    "equipment": "other",
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
    "aliases": [
      "gobletsquat"
    ]
  },
  {
    "id": "benpress",
    "name": "Benpress",
    "category": "Ben",
    "equipment": "machine",
    "aliases": [
      "leg press"
    ]
  },
  {
    "id": "utfallssteg",
    "name": "Utfallssteg",
    "category": "Ben",
    "equipment": "barbell",
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
    "aliases": [
      "goodmorning"
    ]
  },
  {
    "id": "bencurl",
    "name": "Bencurl",
    "category": "Ben",
    "equipment": "machine",
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
    "aliases": [
      "seated calf raise"
    ]
  },
  {
    "id": "box-jump",
    "name": "Box jump",
    "category": "Ben",
    "equipment": "other",
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
    "aliases": [
      "arnold press"
    ]
  },
  {
    "id": "sidolyft",
    "name": "Sidolyft",
    "category": "Axlar",
    "equipment": "dumbbell",
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
    "aliases": [
      "front raise"
    ]
  },
  {
    "id": "face-pull",
    "name": "Face pulls",
    "category": "Axlar",
    "equipment": "cable",
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
    "aliases": [
      "hammer curl"
    ]
  },
  {
    "id": "preacher-curl",
    "name": "Preacher curl",
    "category": "Armar",
    "equipment": "barbell",
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
    "aliases": [
      "concentration curl"
    ]
  },
  {
    "id": "kabelcurl",
    "name": "Kabelcurl",
    "category": "Armar",
    "equipment": "cable",
    "aliases": [
      "cable curl"
    ]
  },
  {
    "id": "reverse-curl",
    "name": "Omvänd curl",
    "category": "Armar",
    "equipment": "barbell",
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
    "aliases": [
      "bench dips",
      "bänkdips"
    ]
  },
  {
    "id": "plankan",
    "name": "Plankan",
    "category": "Core",
    "equipment": "body only",
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
    "aliases": [
      "rysk twist"
    ]
  },
  {
    "id": "hangande-benlyft",
    "name": "Hängande benlyft",
    "category": "Core",
    "equipment": "body only",
    "aliases": [
      "hanging leg raise"
    ]
  },
  {
    "id": "benlyft-liggande",
    "name": "Liggande benlyft",
    "category": "Core",
    "equipment": "body only",
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
    "aliases": [
      "bergsklättrare"
    ]
  },
  {
    "id": "dead-bug",
    "name": "Dead bug",
    "category": "Core",
    "equipment": "body only",
    "aliases": [
      "deadbug"
    ]
  },
  {
    "id": "ab-wheel",
    "name": "Ab wheel",
    "category": "Core",
    "equipment": "other",
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
    "aliases": [
      "side bend"
    ]
  },
  {
    "id": "superman",
    "name": "Superman",
    "category": "Core",
    "equipment": "body only",
    "aliases": [
      "ryggresning golv"
    ]
  },
  {
    "id": "lopning",
    "name": "Löpning",
    "category": "Kondition",
    "equipment": "machine",
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
    "aliases": [
      "elliptical"
    ]
  },
  {
    "id": "stairmaster",
    "name": "Stairmaster",
    "category": "Kondition",
    "equipment": "machine",
    "aliases": [
      "trappmaskin"
    ]
  },
  {
    "id": "hopprep",
    "name": "Hopprep",
    "category": "Kondition",
    "equipment": "other",
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
    "aliases": [
      "kamprep"
    ]
  }
]

const BY_ID = new Map(EXERCISE_CATALOG.map((e) => [e.id, e]))

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, ' ').trim()
}

const BY_NAME = new Map<string, ApiCatalogExercise>()
for (const e of EXERCISE_CATALOG) {
  BY_NAME.set(normalize(e.name), e)
  for (const a of e.aliases) BY_NAME.set(normalize(a), e)
}

export function getExerciseById(id: string): ApiCatalogExercise | undefined {
  return BY_ID.get(id)
}

/** Mappar ett fritextnamn till en katalogövning (exakt först, sedan delsträng). */
export function matchExercise(name: string): ApiCatalogExercise | undefined {
  const n = normalize(name)
  const exact = BY_NAME.get(n)
  if (exact) return exact
  let best: ApiCatalogExercise | undefined
  let bestLen = 0
  for (const [key, ex] of BY_NAME) {
    if (key.length > 3 && (n.includes(key) || key.includes(n)) && key.length > bestLen) {
      best = ex
      bestLen = key.length
    }
  }
  return best
}

/** Kompakt lista att bädda in i AI-prompten (id + namn per kategori). */
export function catalogForPrompt(): string {
  const byCat = new Map<string, ApiCatalogExercise[]>()
  for (const e of EXERCISE_CATALOG) {
    const list = byCat.get(e.category) ?? []
    list.push(e)
    byCat.set(e.category, list)
  }
  return [...byCat.entries()]
    .map(([cat, list]) => `${cat}: ${list.map((e) => `${e.id} (${e.name})`).join(', ')}`)
    .join('\n')
}
