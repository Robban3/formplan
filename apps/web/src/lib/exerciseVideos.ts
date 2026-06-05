export interface ExerciseMediaInfo {
  youtubeId: string
  label: string
  /** Mapp i free-exercise-db (två bildrutor animeras) */
  frames: string
}

const FRAME_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

const DEFAULT_FRAMES = 'Bodyweight_Squat'

/** Nyckel → media för övning */
const MEDIA: Record<string, ExerciseMediaInfo> = {
  burpees: { youtubeId: 'dGqTv0VqqNU', label: 'Burpees', frames: 'Bench_Jump' },
  kettlebell_swing: { youtubeId: '1cVT3eq9YOk', label: 'Kettlebell swing', frames: 'One-Arm_Kettlebell_Swings' },
  goblet_squat: { youtubeId: '2C-uNgJgMjI', label: 'Goblet squat', frames: 'Goblet_Squat' },
  mountain_climbers: { youtubeId: 'cnyTQDSE884', label: 'Mountain climbers', frames: 'Mountain_Climbers' },
  plank: { youtubeId: 'ASdvN_XEl_c', label: 'Plankan', frames: 'Plank' },
  running_intervals: { youtubeId: 'brFHyOtTwH4', label: 'Löpintervaller', frames: 'Running_Treadmill' },
  russian_twist: { youtubeId: '3N5bUgc6-Gc', label: 'Russian twist', frames: 'Russian_Twist' },
  bicycle_crunch: { youtubeId: '9FGilxCbdz8', label: 'Bicycle crunch', frames: 'Cross-Body_Crunch' },
  dead_bug: { youtubeId: 'wMgmfCySKw0', label: 'Dead bug', frames: 'Dead_Bug' },
  squat_dumbbell: { youtubeId: 'M5YrLvJzXaE', label: 'Knäböj med hantlar', frames: 'Dumbbell_Squat' },
  squat_barbell: { youtubeId: 'bU9eDfs_1hs', label: 'Knäböj', frames: 'Barbell_Squat' },
  dumbbell_row: { youtubeId: 'pYcpY20QaE8', label: 'Hantelrodd', frames: 'Bent_Over_Two-Dumbbell_Row' },
  dumbbell_press: { youtubeId: 'AduT4u7cnN4', label: 'Hantelpress', frames: 'Dumbbell_Bench_Press' },
  lunge: { youtubeId: 'wrwwXB_HwKQ', label: 'Utfallsgång', frames: 'Bodyweight_Walking_Lunge' },
  walk: { youtubeId: 'nIjVuRTm-dc', label: 'Promenad', frames: 'Walking_Treadmill' },
  mobility: { youtubeId: '4m2LFbZXO5s', label: 'Mobilitet', frames: 'Runners_Stretch' },
  stretch: { youtubeId: 'jEyaHr3cFbA', label: 'Stretch', frames: 'Runners_Stretch' },
  bench_press: { youtubeId: 'rT7DgCr-3pg', label: 'Bänkpress', frames: 'Barbell_Bench_Press_-_Medium_Grip' },
  incline_bench: { youtubeId: 'SytUyHstjYg', label: 'Sned bänkpress', frames: 'Barbell_Incline_Bench_Press_-_Medium_Grip' },
  overhead_press: { youtubeId: 'qEwKCR5JCog', label: 'Axelpress', frames: 'Barbell_Shoulder_Press' },
  tricep_dips: { youtubeId: '6kALZik-Y-Q', label: 'Triceps dips', frames: 'Bench_Dips' },
  tricep_pushdown: { youtubeId: '2-LAMcpzODU', label: 'Triceps pushdown', frames: 'Triceps_Pushdown' },
  romanian_deadlift: { youtubeId: 'JCXUYozaWew', label: 'Rumänsk marklyft', frames: 'Romanian_Deadlift' },
  leg_press: { youtubeId: '8Zx6kLPu2yY', label: 'Benpress', frames: 'Leg_Press' },
  hip_thrust: { youtubeId: '6xg7bykB05Q', label: 'Hip thrust', frames: 'Barbell_Glute_Bridge' },
  calf_raise: { youtubeId: '3ZRe_QpvRPg', label: 'Vadpress', frames: 'Calf_Press' },
  deadlift: { youtubeId: 'op9klsnPhFI', label: 'Marklyft', frames: 'Barbell_Deadlift' },
  lat_pulldown: { youtubeId: 'CAwf7n6Luuc', label: 'Lat pulldown', frames: 'Close-Grip_Front_Lat_Pulldown' },
  bicep_curl: { youtubeId: 'ykJmrCn5cUw', label: 'Hantelcurl', frames: 'Barbell_Curl' },
  face_pull: { youtubeId: '4th8GsNlbY8', label: 'Face pull', frames: 'Face_Pull' },
  arnold_press: { youtubeId: '6h2w2vV9THg', label: 'Arnold press', frames: 'Arnold_Dumbbell_Press' },
  lateral_raise: { youtubeId: '3VcKaXpzqRo', label: 'Lateral raises', frames: 'Lateral_Raise_-_With_Bands' },
  hammer_curl: { youtubeId: 'zCgcEI9gdwg', label: 'Hammer curl', frames: 'Hammer_Curls' },
  skull_crusher: { youtubeId: 'd_KZ9JHLwEw', label: 'Skull crushers', frames: 'Decline_Close-Grip_Bench_To_Skull_Crusher' },
  cycling: { youtubeId: 'N7f0QNtn1bE', label: 'Cykling', frames: 'Bicycling_Stationary' },
  rowing: { youtubeId: 'O7yia7u4X0E', label: 'Rodd', frames: 'Rowing_Stationary' },
  push_up: { youtubeId: 'IODxDxX7niM', label: 'Push-ups', frames: 'Pushups' },
  farmer_walk: { youtubeId: 'QHnV9JDwRmM', label: 'Farmer walk', frames: 'Farmers_Walk' },
  step_up: { youtubeId: '6x9IsLGZiww', label: 'Step-ups', frames: 'Step-up_with_Knee_Raise' },
  bird_dog: { youtubeId: 'wiFNA3rqvww', label: 'Bird dog', frames: 'Superman' },
  warmup: { youtubeId: '7VLkL_HsE4I', label: 'Uppvärmning', frames: 'Jogging_Treadmill' },
  cooldown: { youtubeId: 'jEyaHr3cFbA', label: 'Nedvarvning', frames: 'Runners_Stretch' },
  tempo_run: { youtubeId: 'brFHyOtTwH4', label: 'Tempolöpning', frames: 'Running_Treadmill' },
  long_run: { youtubeId: 'brFHyOtTwH4', label: 'Långlöpning', frames: 'Jogging_Treadmill' },
  fartlek: { youtubeId: 'brFHyOtTwH4', label: 'Fartlek', frames: 'Running_Treadmill' },
  single_leg_rdl: { youtubeId: 'CcF4TeTbH7Q', label: 'Enbens marklyft', frames: 'Romanian_Deadlift' },
  core_circuit: { youtubeId: 'ASdvN_XEl_c', label: 'Core-circuit', frames: 'Plank' },
}

/** Exakta och partiella alias (normaliserat namn → nyckel) */
const ALIAS_ENTRIES: [string, string][] = [
  ['burpees', 'burpees'],
  ['kettlebell swings', 'kettlebell_swing'],
  ['kettlebell swing', 'kettlebell_swing'],
  ['goblet squat', 'goblet_squat'],
  ['mountain climbers', 'mountain_climbers'],
  ['plankan', 'plank'],
  ['plank', 'plank'],
  ['lopintervaller', 'running_intervals'],
  ['russian twist', 'russian_twist'],
  ['bicycle crunch', 'bicycle_crunch'],
  ['dead bug', 'dead_bug'],
  ['knaboj med hantlar', 'squat_dumbbell'],
  ['knaboj', 'squat_barbell'],
  ['hantelrodd', 'dumbbell_row'],
  ['enarms hantelrodd', 'dumbbell_row'],
  ['hantelpress', 'dumbbell_press'],
  ['utfallsgang', 'lunge'],
  ['promenad eller cykel', 'walk'],
  ['promenad', 'walk'],
  ['mobilitet hofter & axlar', 'mobility'],
  ['mobilitet', 'mobility'],
  ['stretch', 'stretch'],
  ['bankpress', 'bench_press'],
  ['sned bankpress', 'incline_bench'],
  ['axelpress', 'overhead_press'],
  ['triceps dips', 'tricep_dips'],
  ['triceps pushdown', 'tricep_pushdown'],
  ['romanian deadlift', 'romanian_deadlift'],
  ['rumansk marklyft', 'romanian_deadlift'],
  ['benpress', 'leg_press'],
  ['hip thrust', 'hip_thrust'],
  ['vadpress', 'calf_raise'],
  ['vadpress i maskin', 'calf_raise'],
  ['marklyft', 'deadlift'],
  ['lat pulldown', 'lat_pulldown'],
  ['hantelcurl', 'bicep_curl'],
  ['face pull', 'face_pull'],
  ['arnold press', 'arnold_press'],
  ['lateral raises', 'lateral_raise'],
  ['hammer curl', 'hammer_curl'],
  ['skull crushers', 'skull_crusher'],
  ['cykling eller rodd', 'cycling'],
  ['cykling', 'cycling'],
  ['rodd', 'rowing'],
  ['push-ups', 'push_up'],
  ['push ups', 'push_up'],
  ['farmer walk', 'farmer_walk'],
  ['step-ups', 'step_up'],
  ['step ups', 'step_up'],
  ['bird dog', 'bird_dog'],
  ['uppvarmning', 'warmup'],
  ['nedvarvning', 'cooldown'],
  ['intervaller', 'running_intervals'],
  ['tempo', 'tempo_run'],
  ['tempolopning', 'tempo_run'],
  ['langlopning/cykling', 'long_run'],
  ['langlopning', 'long_run'],
  ['fartlek', 'fartlek'],
  ['enbens romanian deadlift', 'single_leg_rdl'],
  ['calf raises', 'calf_raise'],
  ['core-circuit', 'core_circuit'],
]

const ALIASES = new Map(ALIAS_ENTRIES)

/** Partiell match om exakt alias saknas */
const PARTIAL_RULES: [RegExp, string][] = [
  [/knäböj|knaboj|squat/i, 'squat_barbell'],
  [/bänk|bankpress|bench/i, 'bench_press'],
  [/marklyft|deadlift/i, 'deadlift'],
  [/utfall|lunge/i, 'lunge'],
  [/plank/i, 'plank'],
  [/burpee/i, 'burpees'],
  [/kettlebell|kb swing/i, 'kettlebell_swing'],
  [/rodd|rowing/i, 'rowing'],
  [/cykel|cykling|bike/i, 'cycling'],
  [/löp|lop|run|intervall|fartlek|tempo/i, 'running_intervals'],
  [/stretch|mobilit/i, 'stretch'],
  [/uppvärm|uppvarm/i, 'warmup'],
  [/nedvarv/i, 'cooldown'],
  [/curl/i, 'bicep_curl'],
  [/press/i, 'overhead_press'],
  [/triceps|tricep/i, 'tricep_pushdown'],
  [/promenad|walk/i, 'walk'],
]

function normalize(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/–|—/g, '-')
}

function resolveMediaKey(exerciseName: string): string | null {
  const n = normalize(exerciseName)
  const exact = ALIASES.get(n)
  if (exact && MEDIA[exact]) return exact

  for (const [pattern, key] of PARTIAL_RULES) {
    if (pattern.test(exerciseName) && MEDIA[key]) return key
  }

  return null
}

export function getExerciseMedia(exerciseName: string): ExerciseMediaInfo | null {
  const key = resolveMediaKey(exerciseName)
  return key ? MEDIA[key]! : null
}

/** @deprecated Använd getExerciseMedia */
export function getExerciseVideo(exerciseName: string): ExerciseMediaInfo | null {
  return getExerciseMedia(exerciseName)
}

export function getExerciseFrameUrls(exerciseName: string): string[] {
  const folder = getExerciseMedia(exerciseName)?.frames ?? DEFAULT_FRAMES
  return [`${FRAME_BASE}${folder}/0.jpg`, `${FRAME_BASE}${folder}/1.jpg`]
}

export function exerciseVideoSearchUrl(exerciseName: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' teknik tutorial')}`
}

export function exerciseVideoEmbedUrl(youtubeId: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`
}

export function exerciseVideoThumbnail(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
}
