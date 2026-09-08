// Bygger övningskatalogen från free-exercise-db (MIT).
//
// Kör: node scripts/build-exercise-catalog.mjs
//
// Gör tre saker:
//   1. Validerar att varje kurerad övning pekar på ett EXISTERANDE id i
//      free-exercise-db (annars avbryts bygget) — det är garantin för att
//      ingen övning kan få fel eller saknad bild.
//   2. Laddar ner de två bildrutorna (start/slut), optimerar till WebP och
//      skriver dem till apps/web/public/exercises/ så appen har dem lokalt
//      (fungerar offline i native-appen, ingen hotlinking mot GitHub).
//   3. Genererar apps/web/src/lib/exerciseCatalog.ts med namn, kategori,
//      utrustning, muskelgrupper och bildsökvägar.
//
// Muskeldatan (primary/secondary) driver muskelkartan i UI:t.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const DB_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'
const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_IMG = path.join(ROOT, 'apps/web/public/exercises')
const OUT_TS = path.join(ROOT, 'apps/web/src/lib/exerciseCatalog.ts')
const OUT_API_TS = path.join(ROOT, 'apps/api/src/lib/exerciseCatalog.ts')
const CACHE = path.join(ROOT, 'scripts/.exercises-cache.json')

/**
 * Kurerad katalog: svenskt namn → verifierat free-exercise-db-id.
 * `aliases` fångar varianter som AI:n eller äldre scheman kan ha skrivit,
 * så gammal historik kan mappas till rätt katalogpost.
 */
const CATALOG = [
  // ── Bröst ──────────────────────────────────────────────────────────────
  { slug: 'bankpress', name: 'Bänkpress', category: 'Bröst', db: 'Barbell_Bench_Press_-_Medium_Grip', aliases: ['bänkpress med skivstång', 'bench press', 'flatbänk'] },
  { slug: 'hantelpress-brost', name: 'Hantelpress', category: 'Bröst', db: 'Dumbbell_Bench_Press', aliases: ['hantelbänkpress', 'dumbbell press'] },
  { slug: 'lutande-bankpress', name: 'Lutande bänkpress', category: 'Bröst', db: 'Barbell_Incline_Bench_Press_-_Medium_Grip', aliases: ['incline bench press', 'snedbänk', 'sned bänkpress'] },
  { slug: 'lutande-hantelpress', name: 'Lutande hantelpress', category: 'Bröst', db: 'Incline_Dumbbell_Press', aliases: ['incline dumbbell press'] },
  { slug: 'armhavningar', name: 'Armhävningar', category: 'Bröst', db: 'Pushups', aliases: ['push-ups', 'pushups', 'armhävning'] },
  { slug: 'flyes', name: 'Flyes', category: 'Bröst', db: 'Dumbbell_Flyes', aliases: ['hantelflyes', 'flys'] },
  { slug: 'pec-deck', name: 'Pec deck', category: 'Bröst', db: 'Butterfly', aliases: ['butterfly', 'maskinflyes'] },
  { slug: 'maskinpress-brost', name: 'Maskinpress bröst', category: 'Bröst', db: 'Machine_Bench_Press', aliases: ['bröstpress maskin'] },
  { slug: 'dips-brost', name: 'Dips', category: 'Bröst', db: 'Dips_-_Chest_Version', aliases: ['dips bröst'] },
  { slug: 'kabelcross', name: 'Kabelcross', category: 'Bröst', db: 'Cable_Crossover', aliases: ['cable crossover', 'kabelkryss'] },

  // ── Rygg ───────────────────────────────────────────────────────────────
  { slug: 'marklyft', name: 'Marklyft', category: 'Rygg', db: 'Barbell_Deadlift', aliases: ['deadlift', 'konventionell marklyft'] },
  { slug: 'pull-ups', name: 'Pull-ups', category: 'Rygg', db: 'Pullups', aliases: ['pullups', 'räckhäv'] },
  { slug: 'chins', name: 'Chins', category: 'Rygg', db: 'Chin-Up', aliases: ['chin-up', 'chinups'] },
  { slug: 'latsdrag', name: 'Latsdrag', category: 'Rygg', db: 'Wide-Grip_Lat_Pulldown', aliases: ['lat pulldown', 'latsdrag brett grepp'] },
  { slug: 'skivstangsrodd', name: 'Skivstångsrodd', category: 'Rygg', db: 'Bent_Over_Barbell_Row', aliases: ['stångrodd', 'barbell row', 'framåtböjd rodd', 'rodd med skivstång'] },
  { slug: 'hantelrodd', name: 'Hantelrodd', category: 'Rygg', db: 'One-Arm_Dumbbell_Row', aliases: ['enarmsrodd', 'dumbbell row'] },
  { slug: 'sittande-kabelrodd', name: 'Sittande kabelrodd', category: 'Rygg', db: 'Seated_Cable_Rows', aliases: ['kabelrodd', 'seated row', 'sittande rodd'] },
  { slug: 't-bar-rodd', name: 'T-bar rodd', category: 'Rygg', db: 'Lying_T-Bar_Row', aliases: ['t-bar row', 'tbar rodd'] },
  { slug: 'pullover', name: 'Pullover', category: 'Rygg', db: 'Straight-Arm_Dumbbell_Pullover', aliases: ['hantelpullover'] },
  { slug: 'rygglyft', name: 'Rygglyft', category: 'Rygg', db: 'Hyperextensions_Back_Extensions', aliases: ['ryggresning', 'back extension', 'hyperextension'] },
  { slug: 'shrugs', name: 'Shrugs', category: 'Rygg', db: 'Barbell_Shrug', aliases: ['axelryckningar', 'shrug'] },

  // ── Ben ────────────────────────────────────────────────────────────────
  { slug: 'knaboj', name: 'Knäböj', category: 'Ben', db: 'Barbell_Full_Squat', aliases: ['squat', 'benböj', 'knäböj med skivstång'] },
  { slug: 'frontboj', name: 'Frontböj', category: 'Ben', db: 'Front_Barbell_Squat', aliases: ['front squat', 'frontknäböj'] },
  { slug: 'goblet-squat', name: 'Goblet squat', category: 'Ben', db: 'Goblet_Squat', aliases: ['gobletsquat'] },
  { slug: 'benpress', name: 'Benpress', category: 'Ben', db: 'Leg_Press', aliases: ['leg press'] },
  { slug: 'utfallssteg', name: 'Utfallssteg', category: 'Ben', db: 'Barbell_Lunge', aliases: ['utfall', 'lunges', 'lunge'] },
  { slug: 'bulgarisk-split-squat', name: 'Bulgarisk split squat', category: 'Ben', db: 'Split_Squats', aliases: ['split squat', 'bulgarian split squat'] },
  { slug: 'step-up', name: 'Step-up', category: 'Ben', db: 'Dumbbell_Step_Ups', aliases: ['stepup', 'uppsteg'] },
  { slug: 'rumansk-marklyft', name: 'Rumänsk marklyft', category: 'Ben', db: 'Romanian_Deadlift', aliases: ['rdl', 'romanian deadlift', 'raka marklyft'] },
  { slug: 'good-morning', name: 'Good morning', category: 'Ben', db: 'Good_Morning', aliases: ['goodmorning'] },
  { slug: 'bencurl', name: 'Bencurl', category: 'Ben', db: 'Lying_Leg_Curls', aliases: ['lårcurl', 'leg curl', 'liggande bencurl'] },
  { slug: 'benspark', name: 'Benspark', category: 'Ben', db: 'Leg_Extensions', aliases: ['leg extension', 'lårspark'] },
  { slug: 'hoftlyft', name: 'Höftlyft', category: 'Ben', db: 'Barbell_Glute_Bridge', aliases: ['glute bridge', 'bäckenlyft'] },
  { slug: 'hip-thrust', name: 'Hip thrust', category: 'Ben', db: 'Barbell_Hip_Thrust', aliases: ['höftstöt', 'hipthrust'] },
  { slug: 'hoftadduktion', name: 'Höftadduktion', category: 'Ben', db: 'Cable_Hip_Adduction', aliases: ['adduktion', 'inåtföring lår'] },
  { slug: 'vadpress-staende', name: 'Vadpress', category: 'Ben', db: 'Standing_Calf_Raises', aliases: ['vadpress', 'stående vadpress', 'calf raise', 'tåhävningar'] },
  { slug: 'vadpress-sittande', name: 'Sittande vadpress', category: 'Ben', db: 'Seated_Calf_Raise', aliases: ['seated calf raise'] },
  { slug: 'box-jump', name: 'Box jump', category: 'Ben', db: 'Front_Box_Jump', aliases: ['boxhopp', 'lådhopp'] },

  // ── Axlar ──────────────────────────────────────────────────────────────
  { slug: 'axelpress', name: 'Axelpress', category: 'Axlar', db: 'Barbell_Shoulder_Press', aliases: ['shoulder press', 'skivstångspress axlar'] },
  { slug: 'militarpress', name: 'Militärpress', category: 'Axlar', db: 'Standing_Military_Press', aliases: ['military press', 'stående press'] },
  { slug: 'hantelpress-axlar', name: 'Hantelpress axlar', category: 'Axlar', db: 'Dumbbell_Shoulder_Press', aliases: ['hantelaxelpress', 'dumbbell shoulder press'] },
  { slug: 'arnoldpress', name: 'Arnoldpress', category: 'Axlar', db: 'Arnold_Dumbbell_Press', aliases: ['arnold press'] },
  { slug: 'sidolyft', name: 'Sidolyft', category: 'Axlar', db: 'Side_Lateral_Raise', aliases: ['lateral raise', 'sidolyft hantlar'] },
  { slug: 'frontlyft', name: 'Frontlyft', category: 'Axlar', db: 'Front_Dumbbell_Raise', aliases: ['front raise'] },
  { slug: 'face-pull', name: 'Face pulls', category: 'Axlar', db: 'Face_Pull', aliases: ['face pull', 'ansiktsdrag'] },
  { slug: 'omvand-flyes', name: 'Omvänd flyes', category: 'Axlar', db: 'Reverse_Flyes', aliases: ['reverse flyes', 'omvända flyes', 'bakre axelflyes'] },
  { slug: 'upright-row', name: 'Upright row', category: 'Axlar', db: 'Upright_Barbell_Row', aliases: ['stående rodd', 'uprightrow'] },

  // ── Armar ──────────────────────────────────────────────────────────────
  { slug: 'bicepscurl', name: 'Bicepscurl', category: 'Armar', db: 'Barbell_Curl', aliases: ['biceps curl', 'skivstångscurl', 'curl'] },
  { slug: 'hammarcurl', name: 'Hammarcurl', category: 'Armar', db: 'Hammer_Curls', aliases: ['hammer curl'] },
  { slug: 'preacher-curl', name: 'Preacher curl', category: 'Armar', db: 'Preacher_Curl', aliases: ['scottcurl', 'preachercurl'] },
  { slug: 'koncentrationscurl', name: 'Koncentrationscurl', category: 'Armar', db: 'Concentration_Curls', aliases: ['concentration curl'] },
  { slug: 'kabelcurl', name: 'Kabelcurl', category: 'Armar', db: 'Standing_Biceps_Cable_Curl', aliases: ['cable curl'] },
  { slug: 'reverse-curl', name: 'Omvänd curl', category: 'Armar', db: 'Reverse_Barbell_Curl', aliases: ['reverse curl', 'omvänd bicepscurl'] },
  { slug: 'tricepspress', name: 'Tricepspress', category: 'Armar', db: 'Triceps_Pushdown', aliases: ['triceps pushdown', 'tricepsnedpress'] },
  { slug: 'repdrag-triceps', name: 'Repdrag triceps', category: 'Armar', db: 'Triceps_Pushdown_-_Rope_Attachment', aliases: ['rope pushdown', 'tricepsrep'] },
  { slug: 'tricepsextension', name: 'Tricepsextension över huvud', category: 'Armar', db: 'Triceps_Overhead_Extension_with_Rope', aliases: ['overhead extension', 'fransk press'] },
  { slug: 'skullcrushers', name: 'Skullcrushers', category: 'Armar', db: 'Lying_Triceps_Press', aliases: ['skullcrusher', 'liggande tricepspress'] },
  { slug: 'tricepsdips', name: 'Tricepsdips', category: 'Armar', db: 'Bench_Dips', aliases: ['bench dips', 'bänkdips', 'triceps dips'] },

  // ── Core ───────────────────────────────────────────────────────────────
  { slug: 'plankan', name: 'Plankan', category: 'Core', db: 'Plank', aliases: ['planka', 'plank'] },
  { slug: 'sidoplanka', name: 'Sidoplanka', category: 'Core', db: 'Side_Bridge', aliases: ['side plank', 'sidplanka'] },
  { slug: 'sit-ups', name: 'Sit-ups', category: 'Core', db: 'Sit-Up', aliases: ['situps', 'magböj'] },
  { slug: 'crunches', name: 'Crunches', category: 'Core', db: 'Crunches', aliases: ['crunch', 'magcrunch'] },
  { slug: 'cykelcrunch', name: 'Cykelcrunch', category: 'Core', db: 'Air_Bike', aliases: ['bicycle crunch', 'cykelmage'] },
  { slug: 'russian-twist', name: 'Russian twist', category: 'Core', db: 'Russian_Twist', aliases: ['rysk twist'] },
  { slug: 'hangande-benlyft', name: 'Hängande benlyft', category: 'Core', db: 'Hanging_Leg_Raise', aliases: ['hanging leg raise'] },
  { slug: 'benlyft-liggande', name: 'Liggande benlyft', category: 'Core', db: 'Flat_Bench_Lying_Leg_Raise', aliases: ['lying leg raise', 'benlyft'] },
  { slug: 'mountain-climbers', name: 'Mountain climbers', category: 'Core', db: 'Mountain_Climbers', aliases: ['bergsklättrare'] },
  { slug: 'dead-bug', name: 'Dead bug', category: 'Core', db: 'Dead_Bug', aliases: ['deadbug'] },
  { slug: 'ab-wheel', name: 'Ab wheel', category: 'Core', db: 'Ab_Roller', aliases: ['maghjul', 'ab roller'] },
  { slug: 'sidoboj', name: 'Sidoböj', category: 'Core', db: 'Dumbbell_Side_Bend', aliases: ['side bend'] },
  { slug: 'superman', name: 'Superman', category: 'Core', db: 'Superman', aliases: ['ryggresning golv'] },

  // ── Kondition ──────────────────────────────────────────────────────────
  { slug: 'lopning', name: 'Löpning', category: 'Kondition', db: 'Running_Treadmill', aliases: ['löpband', 'running', 'löppass', 'jogging'] },
  { slug: 'gang', name: 'Gång', category: 'Kondition', db: 'Walking_Treadmill', aliases: ['promenad', 'walking'] },
  { slug: 'cykling', name: 'Cykling', category: 'Kondition', db: 'Bicycling', aliases: ['cykel', 'spinning', 'bike'] },
  { slug: 'roddmaskin', name: 'Roddmaskin', category: 'Kondition', db: 'Rowing_Stationary', aliases: ['rodd', 'rowing'] },
  { slug: 'crosstrainer', name: 'Crosstrainer', category: 'Kondition', db: 'Elliptical_Trainer', aliases: ['elliptical'] },
  { slug: 'stairmaster', name: 'Stairmaster', category: 'Kondition', db: 'Stairmaster', aliases: ['trappmaskin'] },
  { slug: 'hopprep', name: 'Hopprep', category: 'Kondition', db: 'Rope_Jumping', aliases: ['hoppa rep', 'jump rope'] },
  { slug: 'kettlebell-swing', name: 'Kettlebell swing', category: 'Kondition', db: 'One-Arm_Kettlebell_Swings', aliases: ['kb swing', 'kettlebellsving'] },
  { slug: 'battle-ropes', name: 'Battle ropes', category: 'Kondition', db: 'Battling_Ropes', aliases: ['kamprep'] },
]

// ── Speglingar av den genererade matchningslogiken ──────────────────────────
// Används bara för validering här i generatorn. Måste hållas i synk med
// normalize()/matchExercise() i mallarna nedan — valideringen är meningslös
// annars, så ändra alltid båda samtidigt.

function normalizeJs(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const STOPWORDS_JS = new Set(['med', 'och', 'pa', 'i', 'for', 'till', 'av', 'the', 'with'])

/** Returnerar en matchare (namn → slug) med samma regler som den genererade. */
function buildMatcher(catalog) {
  const byName = new Map()
  for (const e of catalog) {
    byName.set(normalizeJs(e.slug), e.slug)
    byName.set(normalizeJs(e.name), e.slug)
    for (const a of e.aliases ?? []) byName.set(normalizeJs(a), e.slug)
  }
  return (name) => {
    const n = normalizeJs(name)
    const exact = byName.get(n)
    if (exact) return exact
    if (n.length < 4) return undefined
    const nameTokens = n.split(' ').filter(Boolean)
    const mustCover = nameTokens.filter((t) => t.length >= 4 && !STOPWORDS_JS.has(t))
    let best
    let bestLen = 0
    for (const [key, slug] of byName) {
      if (key.length < 4) continue
      const keyTokens = key.split(' ').filter(Boolean)
      if (!keyTokens.every((t) => nameTokens.includes(t))) continue
      if (!mustCover.every((t) => keyTokens.includes(t))) continue
      if (key.length > bestLen) {
        best = slug
        bestLen = key.length
      }
    }
    return best
  }
}

async function loadDb() {
  if (existsSync(CACHE)) return JSON.parse(await readFile(CACHE, 'utf8'))
  const res = await fetch(DB_URL)
  if (!res.ok) throw new Error(`Kunde inte hämta free-exercise-db: ${res.status}`)
  const json = await res.json()
  await writeFile(CACHE, JSON.stringify(json))
  return json
}

async function main() {
  const db = await loadDb()
  const byId = new Map(db.map((e) => [e.id, e]))

  // 1. Validera — avbryt hellre bygget än att skeppa en övning utan/med fel bild.
  const problems = []
  const slugs = new Set()
  for (const item of CATALOG) {
    if (slugs.has(item.slug)) problems.push(`Dubblerad slug: ${item.slug}`)
    slugs.add(item.slug)
    const src = byId.get(item.db)
    if (!src) problems.push(`${item.name}: okänt free-exercise-db-id "${item.db}"`)
    else if (!src.images || src.images.length < 2) problems.push(`${item.name}: saknar två bildrutor`)
  }

  // Två poster får inte peka på samma källövning — då skulle de få identiska
  // bilder och användaren se samma foto för två olika övningar.
  const byDb = new Map()
  for (const item of CATALOG) {
    const prev = byDb.get(item.db)
    if (prev) problems.push(`${item.name} och ${prev} delar free-exercise-db-id "${item.db}"`)
    else byDb.set(item.db, item.name)
  }

  // Namn/alias måste vara unika över hela katalogen — annars "stjäl" en post
  // en annans nyckel och matchningen pekar tyst fel.
  const keyOwner = new Map()
  for (const item of CATALOG) {
    for (const key of [item.name, ...(item.aliases ?? [])].map(normalizeJs)) {
      const prev = keyOwner.get(key)
      if (prev && prev !== item.slug) {
        problems.push(`Nyckeln "${key}" används av både ${prev} och ${item.slug}`)
      } else keyOwner.set(key, item.slug)
    }
  }

  // Varje id måste mappa tillbaka till sig självt. Annars är migreringen av
  // träningshistoriken inte idempotent — en omkörning skulle flytta serier
  // till fel övning och dubbelräkna volym.
  const matcher = buildMatcher(CATALOG)
  for (const item of CATALOG) {
    const back = matcher(item.id ?? item.slug)
    if (back !== item.slug) {
      problems.push(`id "${item.slug}" matchar tillbaka till "${back ?? 'undefined'}" — inte idempotent`)
    }
  }

  if (problems.length) {
    console.error('Katalogen är ogiltig:\n' + problems.map((p) => '  - ' + p).join('\n'))
    process.exit(1)
  }

  // 2. Ladda ner + optimera bilderna.
  await mkdir(OUT_IMG, { recursive: true })
  let downloaded = 0
  for (const item of CATALOG) {
    const src = byId.get(item.db)
    for (let i = 0; i < 2; i++) {
      const out = path.join(OUT_IMG, `${item.slug}-${i}.webp`)
      if (existsSync(out)) continue
      const res = await fetch(`${IMG_BASE}/${src.images[i]}`)
      if (!res.ok) throw new Error(`Bild saknas för ${item.name}: ${src.images[i]} (${res.status})`)
      // sharp importeras lazy — behövs bara när en ny bild faktiskt ska hämtas,
      // så katalogen kan regenereras även utan den installerad.
      const { default: sharp } = await import('sharp')
      const buf = Buffer.from(await res.arrayBuffer())
      await sharp(buf).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 72 }).toFile(out)
      downloaded++
    }
  }

  // 3. Generera katalogfilen.
  const entries = CATALOG.map((item) => {
    const src = byId.get(item.db)
    return {
      id: item.slug,
      name: item.name,
      category: item.category,
      equipment: src.equipment ?? 'other',
      primaryMuscles: src.primaryMuscles ?? [],
      secondaryMuscles: src.secondaryMuscles ?? [],
      images: [`/exercises/${item.slug}-0.webp`, `/exercises/${item.slug}-1.webp`],
      aliases: item.aliases ?? [],
    }
  })

  const ts = `// GENERERAD FIL — ändra inte för hand.
// Kör \`node scripts/build-exercise-catalog.mjs\` för att bygga om.
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

export const EXERCISE_CATALOG: CatalogExercise[] = ${JSON.stringify(entries, null, 2)}

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
    .replace(/[\\u0300-\\u036f]/g, '')
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
`
  await writeFile(OUT_TS, ts)

  // 4. API-sidan behöver samma lista för att kunna LÅSA AI:n till katalogen och
  //    validera svaret. Genereras från samma källa så de aldrig glider isär.
  const apiEntries = CATALOG.map((item) => ({
    id: item.slug,
    name: item.name,
    category: item.category,
    equipment: byId.get(item.db).equipment ?? 'other',
    aliases: item.aliases ?? [],
  }))
  const apiTs = `// GENERERAD FIL — ändra inte för hand.
// Kör \`node scripts/build-exercise-catalog.mjs\` för att bygga om.
// Samma källa som apps/web/src/lib/exerciseCatalog.ts.

export interface ApiCatalogExercise {
  id: string
  name: string
  category: string
  equipment: string
  aliases: string[]
}

export const EXERCISE_CATALOG: ApiCatalogExercise[] = ${JSON.stringify(apiEntries, null, 2)}

const BY_ID = new Map(EXERCISE_CATALOG.map((e) => [e.id, e]))

function normalize(s: string): string {
  // NFD + borttagna kombinerande tecken gör att dekomponerade â/ä/ö (som iOS
  // och vissa tangentbord producerar) normaliseras likadant som precomponerade.
  return s
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
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

/** Kompakt lista att bädda in i AI-prompten (id + namn per kategori). */
export function catalogForPrompt(): string {
  const byCat = new Map<string, ApiCatalogExercise[]>()
  for (const e of EXERCISE_CATALOG) {
    const list = byCat.get(e.category) ?? []
    list.push(e)
    byCat.set(e.category, list)
  }
  return [...byCat.entries()]
    .map(([cat, list]) => \`\${cat}: \${list.map((e) => \`\${e.id} (\${e.name})\`).join(', ')}\`)
    .join('\\n')
}
`
  await writeFile(OUT_API_TS, apiTs)

  console.log(`✓ ${CATALOG.length} övningar, ${downloaded} nya bilder optimerade`)
  console.log(`✓ ${path.relative(ROOT, OUT_TS)}`)
  console.log(`✓ ${path.relative(ROOT, OUT_API_TS)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
