import { MUSCLE_LABELS, type Muscle } from '../../lib/exerciseCatalog'

/**
 * Förenklad muskelkarta — fram- och baksida sida vid sida, ritad som inline-SVG
 * (inga externa filer, inga bibliotek). Primära muskler får en stark färg ur
 * appens forest-palett, sekundära en ljusare ton av samma kulör och resten
 * ligger kvar som neutralt grå silhuett.
 *
 * Figuren är byggd av en spegelvänd halva (armar, ben, bröst, lats, sätesmuskler)
 * plus mittdelar (nacke, mage, kappmuskel, mellan-/ländrygg), så vänster och
 * höger sida alltid är exakt symmetriska.
 */

type Tone = 'primary' | 'secondary' | 'idle'

const COLOR: Record<Tone, string> = {
  primary: '#0d9480', // forest-700
  secondary: '#7fd3c5', // ljusare ton av samma kulör
  idle: '#dcd8d4',
}

const BASE = '#eae7e4'
const CAPTION = '#a8a29e'

// Fördelning mellan vyerna (tillsammans täcker de alla 17 grupperna):
//   Framsida: nacke, axlar, bröst, mage, biceps, underarmar, framsida lår,
//             höftadduktorer, höftabduktorer, vader
//   Baksida:  kappmuskel, latissimus, mellanrygg, ländrygg, säte,
//             baksida lår, triceps, vader
// En muskel som inte syns i en vy ritas helt enkelt inte där.

const MIRROR = 'translate(60 0) scale(-1 1)'

interface FigureProps {
  toneOf: (m: Muscle) => Tone
}

/** Silhuett: mittdelar (huvud, hals, bål, höft). */
function CenterBase() {
  return (
    <g fill={BASE}>
      <circle cx="30" cy="9.5" r="7" />
      <rect x="26.2" y="14" width="7.6" height="6.4" rx="2.4" />
      <path d="M19.4 23.2Q30 19.6 40.6 23.2L41.2 41Q40.2 50.5 37.6 56.4L37.6 66.5 22.4 66.5 22.4 56.4Q19.8 50.5 18.8 41Z" />
    </g>
  )
}

/** Silhuett: en kroppshalva (arm, hand, ben, fot) — speglas för andra sidan. */
function SideBase() {
  return (
    <g fill={BASE} stroke={BASE} strokeLinecap="round">
      <path d="M17.8 27 13.4 46.5" fill="none" strokeWidth="8.6" />
      <path d="M13.4 46.5 10.3 65" fill="none" strokeWidth="6.8" />
      <circle cx="9.8" cy="68.6" r="3.1" stroke="none" />
      <path d="M25.8 65 23.8 86" fill="none" strokeWidth="13.5" />
      <path d="M23.8 86 22.8 104" fill="none" strokeWidth="10" />
      <rect x="18.4" y="103.6" width="8.8" height="4.6" rx="2.3" stroke="none" />
    </g>
  )
}

/** Muskelgrupper som ligger i mittlinjen. */
function CenterMuscles({ view, toneOf }: FigureProps & { view: 'front' | 'back' }) {
  if (view === 'front') {
    return (
      <g stroke="none">
        <rect x="26.4" y="14.6" width="7.2" height="5.8" rx="2.2" fill={COLOR[toneOf('neck')]} />
        <rect x="25.6" y="37.2" width="8.8" height="17.6" rx="3" fill={COLOR[toneOf('abdominals')]} />
        {/* Antydda bukmuskelsegment */}
        <g fill="none" stroke={BASE} strokeWidth="0.7" strokeLinecap="round">
          <path d="M26.4 43.2H33.6M26.4 48.6H33.6M30 37.6V54.4" />
        </g>
      </g>
    )
  }
  return (
    <g stroke="none">
      <path d="M23.6 21.5 30 18.2 36.4 21.5 34.4 30.6 30 32.8 25.6 30.6Z" fill={COLOR[toneOf('traps')]} />
      <path d="M27.2 31h5.6v14.5Q30 48.6 27.2 45.5Z" fill={COLOR[toneOf('middle back')]} />
      <path d="M25.4 46.8h9.2Q36.4 52.6 36 58.4H24Q23.6 52.6 25.4 46.8Z" fill={COLOR[toneOf('lower back')]} />
    </g>
  )
}

/** Muskelgrupper på en kroppshalva — renderas två gånger (spegelvänt). */
function SideMuscles({ view, toneOf }: FigureProps & { view: 'front' | 'back' }) {
  if (view === 'front') {
    return (
      <g stroke="none">
        <ellipse cx="17.6" cy="27" rx="6" ry="5.7" fill={COLOR[toneOf('shoulders')]} />
        <path
          d="M21.2 25.4C24.6 23.9 27.6 24.1 29.2 25.8v9.6C25.8 37.2 22.2 35.6 20.9 31.8Z"
          fill={COLOR[toneOf('chest')]}
        />
        <g fill="none" strokeLinecap="round">
          <path d="M17.4 28.6 13.9 43.4" stroke={COLOR[toneOf('biceps')]} strokeWidth="7" />
          <path d="M12.9 48.6 10.2 63.4" stroke={COLOR[toneOf('forearms')]} strokeWidth="5.8" />
          <path d="M21.3 66.4 20.3 74.6" stroke={COLOR[toneOf('abductors')]} strokeWidth="4.6" />
          <path d="M25.9 67.4 24.2 83.6" stroke={COLOR[toneOf('quadriceps')]} strokeWidth="11" />
          <path d="M29.3 68.4 27.9 79.6" stroke={COLOR[toneOf('adductors')]} strokeWidth="4.2" />
          <path d="M23.6 88.6 22.9 100.4" stroke={COLOR[toneOf('calves')]} strokeWidth="7.4" />
        </g>
      </g>
    )
  }
  return (
    <g stroke="none">
      <path
        d="M21.4 30.2C19.6 37 20.6 45.4 25 49.6l3.2-8V30.4Z"
        fill={COLOR[toneOf('lats')]}
      />
      <ellipse cx="26.6" cy="62" rx="5.4" ry="5.2" fill={COLOR[toneOf('glutes')]} />
      <g fill="none" strokeLinecap="round">
        <path d="M17.4 28.6 13.9 43.4" stroke={COLOR[toneOf('triceps')]} strokeWidth="7" />
        <path d="M25.9 68.4 24.2 84.6" stroke={COLOR[toneOf('hamstrings')]} strokeWidth="11" />
        <path d="M23.6 88.4 22.8 100.4" stroke={COLOR[toneOf('calves')]} strokeWidth="7.8" />
      </g>
    </g>
  )
}

function Figure({
  view,
  toneOf,
  x,
  label,
}: FigureProps & { view: 'front' | 'back'; x: number; label: string }) {
  return (
    <g transform={`translate(${x} 2)`}>
      <CenterBase />
      <SideBase />
      <g transform={MIRROR}>
        <SideBase />
      </g>
      {/* Sidomusklerna först — mittdelarna (t.ex. mellanryggen) ska ligga överst. */}
      <SideMuscles view={view} toneOf={toneOf} />
      <g transform={MIRROR}>
        <SideMuscles view={view} toneOf={toneOf} />
      </g>
      <CenterMuscles view={view} toneOf={toneOf} />
      <text
        x="30"
        y="118"
        textAnchor="middle"
        fontSize="7"
        fill={CAPTION}
        fontWeight="600"
      >
        {label}
      </text>
    </g>
  )
}

export interface MuscleMapProps {
  primary: Muscle[]
  secondary?: Muscle[]
  className?: string
  /** Dölj textlistan under figurerna (t.ex. i mycket kompakta lägen). */
  hideLegend?: boolean
}

export function MuscleMap({ primary, secondary = [], className = '', hideLegend }: MuscleMapProps) {
  const primaryList = [...new Set(primary)]
  const primarySet = new Set(primaryList)
  // Primär vinner om samma muskel råkar finnas i båda listorna.
  const secondaryList = [...new Set(secondary)].filter((m) => !primarySet.has(m))
  const secondarySet = new Set(secondaryList)

  const toneOf = (m: Muscle): Tone =>
    primarySet.has(m) ? 'primary' : secondarySet.has(m) ? 'secondary' : 'idle'

  const primaryLabels = primaryList.map((m) => MUSCLE_LABELS[m])
  const secondaryLabels = secondaryList.map((m) => MUSCLE_LABELS[m])

  const ariaLabel =
    primaryLabels.length > 0
      ? `Muskelkarta. Primära muskler: ${primaryLabels.join(', ')}.` +
        (secondaryLabels.length > 0 ? ` Sekundära muskler: ${secondaryLabels.join(', ')}.` : '')
      : 'Muskelkarta utan markerade muskler.'

  return (
    <div className={className} role="img" aria-label={ariaLabel}>
      <svg viewBox="0 0 140 124" className="w-full h-auto" aria-hidden="true" focusable="false">
        <Figure view="front" toneOf={toneOf} x={0} label="Framsida" />
        <Figure view="back" toneOf={toneOf} x={80} label="Baksida" />
      </svg>

      {!hideLegend && (primaryLabels.length > 0 || secondaryLabels.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2" aria-hidden="true">
          {primaryList.map((m) => (
            <span
              key={`p-${m}`}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-forest-800 bg-forest-50 border border-forest-200 rounded-full px-2 py-0.5"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLOR.primary }} />
              {MUSCLE_LABELS[m]}
            </span>
          ))}
          {secondaryList.map((m) => (
            <span
              key={`s-${m}`}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500 bg-stone-100 rounded-full px-2 py-0.5"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLOR.secondary }} />
              {MUSCLE_LABELS[m]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
