// GENERERAD FIL — ändra inte för hand.
// Kör `node scripts/build-exercise-catalog.mjs` för att bygga om.
// Samma källa som apps/web/src/lib/exerciseCatalog.ts.

export interface ApiCatalogExercise {
  id: string
  name: string
  category: string
  equipment: string
  /**
   * free-exercise-db:s svårighetsgrad: 'beginner' | 'intermediate' | 'expert'.
   *
   * INFORMATION TILL MODELLEN, INTE ETT FILTER. Källans nivåer är grova:
   * Knäböj, Marklyft och Crosstrainer är märkta 'intermediate', och en
   * nybörjare ska absolut göra alla tre. Att filtrera på nivå hade tömt
   * katalogen för den som angett nybörjare. Nivån finns med i prompten så
   * modellen kan väga in den — t.ex. att Handstående armhävningar är den enda
   * axelövning en kroppsviktsanvändare har, och att den är expertnivå.
   */
  level: string
  aliases: string[]
}

export const EXERCISE_CATALOG: ApiCatalogExercise[] = [
  {
    "id": "bankpress",
    "name": "Bänkpress",
    "category": "Bröst",
    "equipment": "barbell",
    "level": "beginner",
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
    "level": "beginner",
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
    "level": "beginner",
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
    "level": "beginner",
    "aliases": [
      "incline dumbbell press"
    ]
  },
  {
    "id": "armhavningar",
    "name": "Armhävningar",
    "category": "Bröst",
    "equipment": "body only",
    "level": "beginner",
    "aliases": [
      "push-ups",
      "pushups",
      "armhävning",
      "armhävning med kroppsvikt"
    ]
  },
  {
    "id": "flyes",
    "name": "Flyes",
    "category": "Bröst",
    "equipment": "dumbbell",
    "level": "beginner",
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
    "level": "beginner",
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
    "level": "beginner",
    "aliases": [
      "bröstpress maskin"
    ]
  },
  {
    "id": "dips-brost",
    "name": "Dips",
    "category": "Bröst",
    "equipment": "body only",
    "level": "intermediate",
    "aliases": [
      "dips bröst"
    ]
  },
  {
    "id": "kabelcross",
    "name": "Kabelcross",
    "category": "Bröst",
    "equipment": "cable",
    "level": "beginner",
    "aliases": [
      "cable crossover",
      "kabelkryss"
    ]
  },
  {
    "id": "armhavningar-upphojda-fotter",
    "name": "Armhävningar med upphöjda fötter",
    "category": "Bröst",
    "equipment": "body only",
    "level": "beginner",
    "aliases": [
      "decline push-up",
      "armhävningar med fötterna upphöjda",
      "lutande armhävningar"
    ]
  },
  {
    "id": "marklyft",
    "name": "Marklyft",
    "category": "Rygg",
    "equipment": "barbell",
    "level": "intermediate",
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
    "level": "beginner",
    "aliases": [
      "pullups",
      "räckhäv",
      "pull ups"
    ]
  },
  {
    "id": "chins",
    "name": "Chins",
    "category": "Rygg",
    "equipment": "body only",
    "level": "beginner",
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
    "level": "beginner",
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
    "level": "beginner",
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
    "level": "beginner",
    "aliases": [
      "enarmsrodd",
      "dumbbell row",
      "enarms hantelrodd"
    ]
  },
  {
    "id": "sittande-kabelrodd",
    "name": "Sittande kabelrodd",
    "category": "Rygg",
    "equipment": "cable",
    "level": "beginner",
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
    "level": "intermediate",
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
    "level": "intermediate",
    "aliases": [
      "hantelpullover"
    ]
  },
  {
    "id": "rygglyft",
    "name": "Rygglyft",
    "category": "Rygg",
    "equipment": "body only",
    "level": "beginner",
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
    "level": "beginner",
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
    "level": "intermediate",
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
    "level": "expert",
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
    "level": "beginner",
    "aliases": [
      "gobletsquat"
    ]
  },
  {
    "id": "benpress",
    "name": "Benpress",
    "category": "Ben",
    "equipment": "machine",
    "level": "beginner",
    "aliases": [
      "leg press"
    ]
  },
  {
    "id": "utfallssteg",
    "name": "Utfallssteg",
    "category": "Ben",
    "equipment": "barbell",
    "level": "intermediate",
    "aliases": [
      "utfall",
      "lunges",
      "lunge",
      "utfallsgång",
      "utfallsgang"
    ]
  },
  {
    "id": "bulgarisk-split-squat",
    "name": "Bulgarisk split squat",
    "category": "Ben",
    "equipment": "body only",
    "level": "intermediate",
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
    "level": "intermediate",
    "aliases": [
      "stepup",
      "uppsteg",
      "step-ups",
      "step ups"
    ]
  },
  {
    "id": "rumansk-marklyft",
    "name": "Rumänsk marklyft",
    "category": "Ben",
    "equipment": "barbell",
    "level": "intermediate",
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
    "level": "intermediate",
    "aliases": [
      "goodmorning"
    ]
  },
  {
    "id": "bencurl",
    "name": "Bencurl",
    "category": "Ben",
    "equipment": "machine",
    "level": "beginner",
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
    "level": "beginner",
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
    "level": "intermediate",
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
    "level": "intermediate",
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
    "level": "beginner",
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
    "level": "beginner",
    "aliases": [
      "vadpress",
      "stående vadpress",
      "calf raise",
      "tåhävningar",
      "calf raises"
    ]
  },
  {
    "id": "vadpress-sittande",
    "name": "Sittande vadpress",
    "category": "Ben",
    "equipment": "machine",
    "level": "beginner",
    "aliases": [
      "seated calf raise"
    ]
  },
  {
    "id": "box-jump",
    "name": "Box jump",
    "category": "Ben",
    "equipment": "other",
    "level": "beginner",
    "aliases": [
      "boxhopp",
      "lådhopp"
    ]
  },
  {
    "id": "knaboj-kroppsvikt",
    "name": "Knäböj med kroppsvikt",
    "category": "Ben",
    "equipment": "body only",
    "level": "beginner",
    "aliases": [
      "bodyweight squat",
      "kroppsviktsknäböj",
      "air squat",
      "knäböj utan vikt"
    ]
  },
  {
    "id": "utfall-kroppsvikt",
    "name": "Gående utfall",
    "category": "Ben",
    "equipment": "body only",
    "level": "beginner",
    "aliases": [
      "walking lunge",
      "bodyweight lunge",
      "gående utfallssteg"
    ]
  },
  {
    "id": "hoftlyft-kroppsvikt",
    "name": "Höftlyft med kroppsvikt",
    "category": "Ben",
    "equipment": "body only",
    "level": "beginner",
    "aliases": [
      "bodyweight glute bridge",
      "höftlyft utan vikt"
    ]
  },
  {
    "id": "axelpress",
    "name": "Axelpress",
    "category": "Axlar",
    "equipment": "barbell",
    "level": "intermediate",
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
    "level": "beginner",
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
    "level": "intermediate",
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
    "level": "intermediate",
    "aliases": [
      "arnold press"
    ]
  },
  {
    "id": "sidolyft",
    "name": "Sidolyft",
    "category": "Axlar",
    "equipment": "dumbbell",
    "level": "beginner",
    "aliases": [
      "lateral raise",
      "sidolyft hantlar",
      "lateral raises",
      "sidolyft med hantlar"
    ]
  },
  {
    "id": "frontlyft",
    "name": "Frontlyft",
    "category": "Axlar",
    "equipment": "dumbbell",
    "level": "beginner",
    "aliases": [
      "front raise"
    ]
  },
  {
    "id": "face-pull",
    "name": "Face pulls",
    "category": "Axlar",
    "equipment": "cable",
    "level": "intermediate",
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
    "level": "beginner",
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
    "level": "beginner",
    "aliases": [
      "stående rodd",
      "uprightrow"
    ]
  },
  {
    "id": "handstaende-armhavningar",
    "name": "Handstående armhävningar",
    "category": "Axlar",
    "equipment": "body only",
    "level": "expert",
    "aliases": [
      "handstand push-ups",
      "handstandspress",
      "handstående press"
    ]
  },
  {
    "id": "bicepscurl",
    "name": "Bicepscurl",
    "category": "Armar",
    "equipment": "barbell",
    "level": "beginner",
    "aliases": [
      "biceps curl",
      "skivstångscurl",
      "curl",
      "bicep curl",
      "hantelcurl"
    ]
  },
  {
    "id": "hammarcurl",
    "name": "Hammarcurl",
    "category": "Armar",
    "equipment": "dumbbell",
    "level": "beginner",
    "aliases": [
      "hammer curl"
    ]
  },
  {
    "id": "preacher-curl",
    "name": "Preacher curl",
    "category": "Armar",
    "equipment": "barbell",
    "level": "beginner",
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
    "level": "beginner",
    "aliases": [
      "concentration curl"
    ]
  },
  {
    "id": "kabelcurl",
    "name": "Kabelcurl",
    "category": "Armar",
    "equipment": "cable",
    "level": "beginner",
    "aliases": [
      "cable curl"
    ]
  },
  {
    "id": "reverse-curl",
    "name": "Omvänd curl",
    "category": "Armar",
    "equipment": "barbell",
    "level": "beginner",
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
    "level": "beginner",
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
    "level": "beginner",
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
    "level": "beginner",
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
    "level": "intermediate",
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
    "level": "beginner",
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
    "level": "beginner",
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
    "level": "beginner",
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
    "level": "beginner",
    "aliases": [
      "situps",
      "magböj",
      "sit ups"
    ]
  },
  {
    "id": "crunches",
    "name": "Crunches",
    "category": "Core",
    "equipment": "body only",
    "level": "beginner",
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
    "level": "beginner",
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
    "level": "intermediate",
    "aliases": [
      "rysk twist"
    ]
  },
  {
    "id": "hangande-benlyft",
    "name": "Hängande benlyft",
    "category": "Core",
    "equipment": "body only",
    "level": "expert",
    "aliases": [
      "hanging leg raise"
    ]
  },
  {
    "id": "benlyft-liggande",
    "name": "Liggande benlyft",
    "category": "Core",
    "equipment": "body only",
    "level": "beginner",
    "aliases": [
      "lying leg raise",
      "benlyft"
    ]
  },
  {
    "id": "mountain-climbers",
    "name": "Mountain climbers",
    "category": "Core",
    "equipment": "body only",
    "level": "beginner",
    "aliases": [
      "bergsklättrare"
    ]
  },
  {
    "id": "dead-bug",
    "name": "Dead bug",
    "category": "Core",
    "equipment": "body only",
    "level": "beginner",
    "aliases": [
      "deadbug"
    ]
  },
  {
    "id": "ab-wheel",
    "name": "Ab wheel",
    "category": "Core",
    "equipment": "other",
    "level": "intermediate",
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
    "level": "beginner",
    "aliases": [
      "side bend"
    ]
  },
  {
    "id": "superman",
    "name": "Superman",
    "category": "Core",
    "equipment": "body only",
    "level": "beginner",
    "aliases": [
      "ryggresning golv"
    ]
  },
  {
    "id": "lopning",
    "name": "Löpning",
    "category": "Kondition",
    "equipment": "machine",
    "level": "beginner",
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
    "level": "beginner",
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
    "level": "beginner",
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
    "level": "intermediate",
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
    "level": "intermediate",
    "aliases": [
      "elliptical"
    ]
  },
  {
    "id": "stairmaster",
    "name": "Stairmaster",
    "category": "Kondition",
    "equipment": "machine",
    "level": "intermediate",
    "aliases": [
      "trappmaskin"
    ]
  },
  {
    "id": "hopprep",
    "name": "Hopprep",
    "category": "Kondition",
    "equipment": "other",
    "level": "intermediate",
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
    "level": "intermediate",
    "aliases": [
      "kb swing",
      "kettlebellsving",
      "kettlebell swings",
      "kettlebell sving"
    ]
  },
  {
    "id": "battle-ropes",
    "name": "Battle ropes",
    "category": "Kondition",
    "equipment": "other",
    "level": "beginner",
    "aliases": [
      "kamprep"
    ]
  }
]

const BY_ID = new Map(EXERCISE_CATALOG.map((e) => [e.id, e]))

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

const BY_NAME = new Map<string, ApiCatalogExercise>()
for (const e of EXERCISE_CATALOG) {
  // Id:t registreras som egen nyckel så matchExercise(id) === id alltid gäller.
  // Utan det blir historik-migreringen icke-idempotent: en omkörning skulle
  // flytta serier till fel övning och dubbelräkna volym.
  BY_NAME.set(normalize(e.id), e)
  BY_NAME.set(normalize(e.name), e)
  for (const a of e.aliases) BY_NAME.set(normalize(a), e)
}

export function getExerciseById(id: string): ApiCatalogExercise | undefined {
  return BY_ID.get(id)
}

/** Ord som inte bär betydelse när övningsnamn jämförs. */
const STOPWORDS = new Set(['med', 'och', 'pa', 'i', 'for', 'till', 'av', 'the', 'with'])

function significantTokens(tokens: string[]): string[] {
  return tokens.filter((t) => t.length >= 4 && !STOPWORDS.has(t))
}

/**
 * Mappar ett fritextnamn till en katalogövning. Exakt namn/alias först, sedan
 * STRIKT tokenmatchning: varje ord i nyckeln måste finnas som eget ord i
 * namnet, OCH nyckeln måste täcka namnets alla betydelsebärande ord.
 * Returnerar hellre undefined än en gissning.
 */
export function matchExercise(name: string): ApiCatalogExercise | undefined {
  const n = normalize(name)
  // Exakt namn/alias först — korta alias (t.ex. "rdl") måste fortfarande fungera.
  const exact = BY_NAME.get(n)
  if (exact) return exact
  // Längdspärren skyddar bara den luddiga matchningen nedan.
  if (n.length < 4) return undefined

  const nameTokens = n.split(' ').filter(Boolean)
  const mustCover = significantTokens(nameTokens)

  let best: ApiCatalogExercise | undefined
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

/**
 * Katalogen som text till prompten.
 *
 * `allowed` är katalogens utrustningsvärden användaren har (se lib/equipment.ts).
 * Utelämnad ⇒ hela katalogen. Varje rad visar utrustning OCH nivå: utan
 * utrustningen kunde modellen inte veta vad en övning krävde, och
 * instruktionen "välj övningar som matchar användarens utrustning" var
 * omöjlig att följa. Nivån är vägledning, inte ett filter (se
 * ApiCatalogExercise.level).
 */
export function catalogForPrompt(allowed?: Set<string>): string {
  const byCat = new Map<string, ApiCatalogExercise[]>()
  for (const e of EXERCISE_CATALOG) {
    if (allowed && !allowed.has(e.equipment)) continue
    const list = byCat.get(e.category) ?? []
    list.push(e)
    byCat.set(e.category, list)
  }
  return [...byCat.entries()]
    .map(([cat, list]) => `${cat}: ${list.map((e) => `${e.id} (${e.name}, ${e.equipment}, ${e.level})`).join(', ')}`)
    .join('\n')
}
