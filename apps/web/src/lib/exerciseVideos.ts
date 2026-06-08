/** Maps exercise names to animation frame folders from free-exercise-db (MIT licensed). */

const FRAME_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

const DEFAULT_FRAMES = 'Bodyweight_Squat'

const MEDIA: Record<string, string> = {
  burpees:           'Bench_Jump',
  kettlebell_swing:  'One-Arm_Kettlebell_Swings',
  goblet_squat:      'Goblet_Squat',
  mountain_climbers: 'Mountain_Climbers',
  plank:             'Plank',
  running_intervals: 'Running_Treadmill',
  russian_twist:     'Russian_Twist',
  bicycle_crunch:    'Cross-Body_Crunch',
  dead_bug:          'Dead_Bug',
  squat_dumbbell:    'Dumbbell_Squat',
  squat_barbell:     'Barbell_Squat',
  dumbbell_row:      'Bent_Over_Two-Dumbbell_Row',
  dumbbell_press:    'Dumbbell_Bench_Press',
  lunge:             'Bodyweight_Walking_Lunge',
  walk:              'Walking_Treadmill',
  mobility:          'Runners_Stretch',
  stretch:           'Runners_Stretch',
  bench_press:       'Barbell_Bench_Press_-_Medium_Grip',
  incline_bench:     'Barbell_Incline_Bench_Press_-_Medium_Grip',
  overhead_press:    'Barbell_Shoulder_Press',
  tricep_dips:       'Bench_Dips',
  tricep_pushdown:   'Triceps_Pushdown',
  romanian_deadlift: 'Romanian_Deadlift',
  leg_press:         'Leg_Press',
  hip_thrust:        'Barbell_Glute_Bridge',
  calf_raise:        'Calf_Press',
  deadlift:          'Barbell_Deadlift',
  lat_pulldown:      'Close-Grip_Front_Lat_Pulldown',
  bicep_curl:        'Barbell_Curl',
  face_pull:         'Face_Pull',
  arnold_press:      'Arnold_Dumbbell_Press',
  lateral_raise:     'Lateral_Raise_-_With_Bands',
  hammer_curl:       'Hammer_Curls',
  skull_crusher:     'Decline_Close-Grip_Bench_To_Skull_Crusher',
  cycling:           'Bicycling_Stationary',
  rowing:            'Rowing_Stationary',
  push_up:           'Pushups',
  farmer_walk:       'Farmers_Walk',
  step_up:           'Step-up_with_Knee_Raise',
  bird_dog:          'Superman',
  warmup:            'Jogging_Treadmill',
  cooldown:          'Runners_Stretch',
  tempo_run:         'Running_Treadmill',
  long_run:          'Jogging_Treadmill',
  fartlek:           'Running_Treadmill',
  single_leg_rdl:    'Romanian_Deadlift',
  core_circuit:      'Plank',
}

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

function resolveKey(exerciseName: string): string | null {
  const n = normalize(exerciseName)
  const exact = ALIASES.get(n)
  if (exact && MEDIA[exact]) return exact
  for (const [pattern, key] of PARTIAL_RULES) {
    if (pattern.test(exerciseName) && MEDIA[key]) return key
  }
  return null
}

export function getExerciseFrameUrls(exerciseName: string): string[] {
  const folder = MEDIA[resolveKey(exerciseName) ?? ''] ?? DEFAULT_FRAMES
  return [`${FRAME_BASE}${folder}/0.jpg`, `${FRAME_BASE}${folder}/1.jpg`]
}

// Keep for backwards compat — returns null always now (no YouTube)
export function getExerciseMedia(_exerciseName: string): null {
  return null
}

/** @deprecated No longer used */
export function getExerciseVideo(_exerciseName: string): null {
  return null
}
