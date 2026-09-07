import { useId } from 'react'
import { MUSCLE_LABELS, type Muscle } from '../../lib/exerciseCatalog'

/**
 * Muskelkarta — stiliserad anatomisk illustration i inline-SVG (inga externa
 * filer, inga bibliotek). Fram- och baksida sida vid sida.
 *
 * Teknik:
 *  1. Silhuetten (huvud, bål, armar, händer, ben, fötter) ritas en gång i en
 *     <mask>. Den masken läggs sedan på hela figuren, så allt annat kan ritas
 *     "grovt" och klipps automatiskt mot kroppens kontur.
 *  2. Inuti masken ligger en grundplatta i kroppsgrått + muskelgrupperna som
 *     *fyllda* former med vita avgränsningslinjer, precis som i en klassisk
 *     anatomisk träningsillustration.
 *
 * Allt ritas som en kroppshalva (x ≤ 50) och speglas med MIRROR, så vänster
 * och höger sida alltid blir exakt symmetriska. Former som ska gå över
 * mittlinjen ritas fram till x = 50 — spegelbilden möter dem kant i kant och
 * de vita konturerna bildar då en mittlinje (rygg, mage, nacke).
 */

/* ------------------------------------------------------------------ *
 * Färger — byt ACCENT_*-konstanterna för att byta accentfärg.
 * Vill man ha rött istället för blått räcker det med t.ex.
 *   ACCENT_PRIMARY = '#d2402a'  och  ACCENT_SECONDARY = '#f2b0a5'
 * ------------------------------------------------------------------ */
const ACCENT_PRIMARY = '#1b9bd8' // primär muskel — stark accent
const ACCENT_SECONDARY = '#8fd0ee' // sekundär muskel — ljusare ton av samma kulör
const MUSCLE_IDLE = '#c9cdd0' // muskel som inte tränas
const BODY_BASE = '#d7dadd' // silhuett (huvud, händer, fötter, leder)
const SEPARATOR = '#ffffff' // avgränsningslinjer mellan muskler
const CAPTION = '#a8a29e' // "Framsida" / "Baksida"
/** Explicit stack så bildtexterna ser rätt ut även när SVG:n renderas utan app-CSS. */
const CAPTION_FONT =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

type Tone = 'primary' | 'secondary' | 'idle'

const COLOR: Record<Tone, string> = {
  primary: ACCENT_PRIMARY,
  secondary: ACCENT_SECONDARY,
  idle: MUSCLE_IDLE,
}

/* Fördelning mellan vyerna (tillsammans täcker de alla 17 grupperna):
 *   Framsida: nacke, axlar, bröst, mage, biceps, underarmar, framsida lår,
 *             höftadduktorer, höftabduktorer, vader (främre skenbensmuskeln)
 *   Baksida:  kappmuskel, axlar, latissimus, mellanrygg, ländrygg, triceps,
 *             underarmar, säte, baksida lår, vader
 * En muskel som inte syns i en vy ritas helt enkelt inte där. */

/** Figurens lokala ritruta: 100 × 200 enheter, mittlinje x = 50. */
const FIGURE_W = 100
const FIGURE_H = 200
const MIRROR = `translate(${FIGURE_W} 0) scale(-1 1)`

type View = 'front' | 'back'

interface ToneProps {
  toneOf: (m: Muscle) => Tone
}

/* ------------------------------------------------------------------ *
 * Silhuett (maskform) — en kroppshalva. Delarna överlappar i lederna.
 * ------------------------------------------------------------------ */
function SilhouetteHalf() {
  return (
    <g fill="#fff">
      {/* Huvud och hals i en enda kontur: rund hjässa, avsmalnande käke och en
          hals som vidgar sig mjukt ned i kappmuskeln/nyckelbenet. */}
      <path
        d="M51 1.4C43.6 1.4 40.4 4.2 41 10.5C41.1 11.6 40.2 13.4 39.6 14.6C39.6 16.8 40.6 19 42.2 20.6C43 21.6 43.4 22.9 43.4 24.4C43.3 26.8 42.8 28.8 41.6 30.4C41 31 40.2 31.9 39 32.6C37.4 33.5 35.4 34.4 33.2 35.2L51 35.2Z"
      />
      {/* Bål — kappmuskelns lutning, bröstkorg, midja och höft */}
      <path d="M51 27.8C45.4 27.9 41.6 28.8 38.6 30.4C36 32.4 33.4 35.4 30.8 39.4C29.6 42.8 29.2 46.4 29.4 50.4C30.2 58 31.8 65.6 33.6 73.2C34.4 77.4 34.8 81 34.6 84C31.2 88.4 28.4 93.6 26.8 100C26.4 102 26.8 104 28 106C32.6 108 38 109.2 44.4 109.6C47.6 108.6 49.3 105.8 51 101Z" />
      {/* Överarm med rundad axelkupa */}
      <path d="M38.8 30.6C30 31.8 24.4 35.6 21.6 40.6C19.8 45.2 18.8 51 18.6 58C18.5 62.8 18.4 68 18.2 73.4L28.2 74.8C28.8 68 29.6 61.2 30.6 54.2C31.6 46.4 34.6 38.4 38.8 30.6Z" />
      {/* Underarm */}
      <path d="M18.2 71.6L28.4 73C28 79.8 26.6 86.4 24.6 92.4C23.7 95.2 22.9 97.2 22.2 98.6L13.6 96.4C14.6 92.8 15.4 88.4 16.2 83C16.8 78.6 17.6 74.4 18.2 71.6Z" />
      {/* Hand: en samlad handflata som vidgar sig mjukt ur handleden. Fingrar och
          tumme antyds med tunna vita linjer i DetailsHalf istället för egna former. */}
      <path d="M15.8 92.8C13.8 95.4 12.5 98.6 12.1 102.4C11.8 106.2 12.6 109 14.4 110.8C16.3 112.2 18.3 112 20.1 110.4C21.5 108.2 22.2 105 22.5 100.8C22.9 97.6 23.4 95.2 23.8 93.2C22 92 17.6 92.2 15.8 92.8Z" />
      {/* Lår */}
      <path d="M48 97.8C41.2 95.8 34 96.8 26.8 101.2C24.8 107.2 24 114 24.4 122C24.6 126.2 25.2 129.8 26.2 132.8L40.8 132.6C42.6 125 44.2 117.2 45.4 109.2C46.1 104.4 47 100.4 48 97.8Z" />
      {/* Underben */}
      <path d="M26.6 130.8L41 130.6C41.8 135.6 40.8 141 38.2 147.2C35.8 153 34.2 158.4 33.4 162.8C33.1 164.4 32.9 165.8 32.8 166.8L26 166.6C25.6 162 25 157.2 24.2 152.4C23.4 147 23.2 142.6 23.8 139C24.3 135.6 25.2 132.9 26.6 130.8Z" />
      {/* Fot — smal kil som pekar snett utåt, tårna antyds med vita linjer */}
      <path d="M26 162.8L32.8 163C33.5 167.4 33.6 171.2 33.1 174.8C32.8 178.3 31.8 180.5 30 180.9L21.6 180.9C19.9 180.9 19.3 179.7 20.1 177.5C20.9 175.2 22.3 173.1 24.1 171.3C25.4 169.9 26 167.1 26 162.8Z" />
    </g>
  )
}

/* ------------------------------------------------------------------ *
 * Muskelgrupper — ritas som halva och speglas.
 * ------------------------------------------------------------------ */
function MusclesHalf({ view, toneOf }: ToneProps & { view: View }) {
  const fill = (m: Muscle) => COLOR[toneOf(m)]

  if (view === 'front') {
    return (
      <>
        {/* Hals (sternocleidomastoideus) — övre kanten blir käklinjen,
            nedre kanten nyckelbenet. */}
        <path
          d="M50 27.2C47.2 26.2 45 24.8 43.4 22.8C43.5 24.8 43.5 26.6 43.2 28.2C42.8 29.4 42.4 30.2 41.6 30.9C40.2 32.4 38.6 34.2 37 36.2C40.8 34.8 45.2 34 50 33.8Z"
          fill={fill('neck')}
        />

        {/* Bröst */}
        <path
          d="M50 33.8C45.2 34 40.8 34.8 37 36.2C34.6 39.2 33.2 42.8 33 47.4C32.9 50 33.3 52.2 34.2 53.8C37.6 56.8 41.4 58.6 45.2 59.2C47 59 48.6 58.4 50 57.4Z"
          fill={fill('chest')}
        />

        {/* Axel (deltoid) — rundad kupa över axelleden */}
        <path
          d="M38.8 30.6C30.4 31.8 24.2 34.6 20.6 40.6C19 45.2 18 50.4 17.8 56.2C17.8 58.8 17.8 60.8 18 62.2C22.2 57.8 27.4 53.8 33.6 50.2C34.2 43 35.6 36.4 38.8 30.6Z"
          fill={fill('shoulders')}
        />

        {/* Biceps */}
        <path
          d="M33.6 50.2C27.4 53.8 22.2 57.8 18 62.2C17.9 66.4 17.7 70.2 17.4 74L28.4 75.2C29 68.4 29.8 61.8 30.8 55.2C31.4 53.2 32.2 51.5 33.6 50.2Z"
          fill={fill('biceps')}
        />

        {/* Underarm */}
        <path
          d="M17.4 71.4L28.8 73.2C28.4 80.2 27 86.8 25 92.8C24.1 95.6 23.2 97.8 22.5 99.2L12.8 96.8C13.8 93.2 14.8 88.6 15.6 83.2C16.4 78.6 17 74.2 17.4 71.4Z"
          fill={fill('forearms')}
        />

        {/* Mage — fyra rader ger sexpack-känsla via de vita linjerna */}
        <g fill={fill('abdominals')}>
          <path d="M50 60L43.2 60C42.9 62.6 42.8 64.9 42.8 67C45.3 67.8 47.7 68.1 50 67.8Z" />
          <path d="M50 67.8C47.7 68.1 45.3 67.8 42.8 67C42.7 69.5 42.6 71.8 42.6 74C45.1 74.8 47.6 75.1 50 74.8Z" />
          <path d="M50 74.8C47.6 75.1 45.1 74.8 42.6 74C42.6 76.5 42.6 78.8 42.7 81C45.2 81.8 47.7 82.1 50 81.8Z" />
          <path d="M50 81.8C47.7 82.1 45.2 81.8 42.7 81C43.1 86.8 44.1 91.8 45.7 96C46.6 98.4 47.8 100.2 49.2 101.4L50 101.4Z" />
        </g>

        {/* Framsida lår */}
        <path
          d="M48 97.4C41.2 95.2 33.6 96.2 26 101C24 107 23.2 114 23.6 122C23.8 125.6 24.4 128.8 25.2 131.4C30.4 133 35.8 133.1 40.8 131.8C42.6 124.4 44.2 116.8 45.4 109C46.1 104.2 47 100.2 48 97.4Z"
          fill={fill('quadriceps')}
        />

        {/* Höftadduktor (inre lår) */}
        <path
          d="M48.6 99.6C47.2 106.6 45.6 113.6 43.6 120.6C42.6 124.4 41.6 127.8 40.6 130.6L36.4 131.8C38.4 124 40.2 115.8 41.6 107.2C42.2 103.2 42.6 100 42.6 97.8C44.6 99.4 46.6 100 48.6 99.6Z"
          fill={fill('adductors')}
        />

        {/* Höftabduktor (yttre höft) */}
        <path
          d="M32.6 94.6C28 97.8 25 103.4 23.8 111C23.1 115.2 23.1 119 23.8 122.4C25.4 118 26.6 112.8 27.4 106.6C28 101.6 29.8 97.4 32.6 94.6Z"
          fill={fill('abductors')}
        />

        {/* Vader framifrån (skenbensmuskeln) */}
        <path
          d="M40.2 133.4C38.8 139.2 37.6 145.2 36.6 151.4C35.8 156.6 35.3 161.2 35.1 165.2L30.6 165.2C30.9 160.6 31.6 155.4 32.8 149.6C34 143.4 35.4 137.9 36.8 133.4Z"
          fill={fill('calves')}
        />
      </>
    )
  }

  return (
    <>
      {/* Kappmuskel (trapezius) */}
      <path
        d="M50 21.4C47.2 21.6 45.2 22.6 43.6 24.4C43.6 26.6 43 28.6 41.6 31C35.4 32.2 29.8 35.4 26.6 40.6C25.8 42 25.7 43.3 26.4 44.6C32.8 51.4 40.6 58.8 50 66.8Z"
        fill={fill('traps')}
      />

      {/* Mellanrygg (romboider / skulderblad) */}
      <path
        d="M26.4 44.6C32.8 51.4 40.6 58.8 50 66.8C41.4 64.8 34.2 60.8 28.8 55C27.2 52.4 26.5 48.8 26.4 44.6Z"
        fill={fill('middle back')}
      />

      {/* Latissimus */}
      <path
        d="M28.8 55C28.2 61.2 28.8 67.6 30.6 74C32.2 80.2 34.4 85.4 37 89C39 91 40.8 91.2 42.6 89.4C44.2 81.8 46.6 74.2 49.8 66.9C41.4 64.8 34.2 60.8 28.8 55Z"
        fill={fill('lats')}
      />

      {/* Ländrygg */}
      <path
        d="M50 66.9C47 73.8 44.8 81.2 43.2 89C42.8 91.2 42.6 93 42.6 94.4L50 94.4Z"
        fill={fill('lower back')}
      />

      {/* Axel (bakre deltoid) */}
      <path
        d="M38.8 30.6C30.4 31.8 24.2 34.6 20.6 40.6C19 45.2 18 50.4 17.8 56.2C17.8 58.8 17.8 60.8 18 62.2C22.2 57.8 27.4 53.8 33.6 50.2C34.2 43 35.6 36.4 38.8 30.6Z"
        fill={fill('shoulders')}
      />

      {/* Triceps */}
      <path
        d="M33.6 50.2C27.4 53.8 22.2 57.8 18 62.2C17.9 66.4 17.7 70.2 17.4 74L28.4 75.2C29 68.4 29.8 61.8 30.8 55.2C31.4 53.2 32.2 51.5 33.6 50.2Z"
        fill={fill('triceps')}
      />

      {/* Underarm */}
      <path
        d="M17.4 71.4L28.8 73.2C28.4 80.2 27 86.8 25 92.8C24.1 95.6 23.2 97.8 22.5 99.2L12.8 96.8C13.8 93.2 14.8 88.6 15.6 83.2C16.4 78.6 17 74.2 17.4 71.4Z"
        fill={fill('forearms')}
      />

      {/* Säte */}
      <path
        d="M50 86.2C43.4 84.8 37.2 86.2 32 90.4C28.4 95.6 27.8 101.8 30 108.4C32.6 114 37 117.2 43.6 117.6C47.6 116.2 49.6 112.4 50 106Z"
        fill={fill('glutes')}
      />

      {/* Baksida lår */}
      <path
        d="M46 112.4C40 115.6 34 116 28.2 113.2C26 118.8 25.1 124.8 25.6 131.4C25.7 132.8 25.9 133.8 26.1 134.6C31.2 136 36 136 40.8 134.6C42.2 128 43.4 121.4 44.4 115C44.8 113.8 45.3 112.8 46 112.4Z"
        fill={fill('hamstrings')}
      />

      {/* Vader bakifrån — två muskelbukar */}
      <g fill={fill('calves')}>
        <path d="M30.6 133.4C27.6 137.8 26.4 143.2 26.8 149.6C27.2 154.2 28.2 158.2 29.6 161.4L34.4 161.4C34.9 151.2 34.6 141.6 33.6 132.6C32.4 133.3 31.4 133.6 30.6 133.4Z" />
        <path d="M34 132.6C35 141.6 35.3 151.2 34.8 161.4L38.8 161.4C41 157.2 42.4 152.6 42.9 147.4C43.3 143.4 43.1 139.8 42.2 136.4C39.4 136.1 36.6 135 34 132.6Z" />
      </g>
    </>
  )
}

/** Tunna vita detaljlinjer (revben, senor, muskelbukar, leder). */
function DetailsHalf({ view }: { view: View }) {
  return (
    <g fill="none" stroke={SEPARATOR} strokeWidth="0.7" strokeLinecap="round">
      {/* Öra — bara en diskret båge, aldrig en egen utstickande form */}
      <path d="M41.4 12.9C40.2 14.4 40 16.6 40.8 19.1" />
      {/* Handled — dubbelt streck som i klassiska anatomiplanscher */}
      <path d="M13.8 96C16.5 95.2 19.2 95.6 21.8 97.1" />
      {/* Handens knogar, fingerdelningar och tumme */}
      <path d="M12.6 101.4C15.6 102.6 19 102.7 22.6 101.6" />
      <path d="M13.9 102.6C14.1 105.8 14.7 108.6 15.6 111" />
      <path d="M16.8 102.9C17 106 17.3 108.8 17.8 111.3" />
      <path d="M19.6 102.7C19.5 105.8 19.4 108.6 19.3 111" />
      <path d="M22.7 98C21.8 99 21.3 100.3 21.3 101.6" />
      {/* Underarmens muskelbukar */}
      <path d="M25.8 76C24.6 81.8 23.1 87.2 21.2 92" />
      {/* Knä */}
      <path d="M28.4 133.2C31.8 134.2 35.4 134.3 38.8 133.6" />
      {/* Vrist — dubbelt streck — och tårnas strimmor */}
      <path d="M25.9 166.2C28.1 167 30.4 167.2 32.8 166.8" />
      <path d="M25.4 169.4C28 170.3 30.5 170.5 33 170.1" />
      <path d="M22.8 173.2C22.3 175.3 22 177 21.9 178.5" />
      <path d="M25.2 172.2C25 174.6 24.9 176.8 24.9 178.5" />
      <path d="M27.7 171.9C27.6 174.4 27.6 176.7 27.7 178.5" />
      <path d="M30.2 172.1C30.2 174.6 30.3 176.8 30.4 178.5" />
      <path d="M20.6 178.6C24.2 179.3 27.8 179.4 31.4 178.9" />
      {view === 'front' ? (
        <>
          {/* Deltoidens delning */}
          <path d="M31.4 34C30.2 40.4 29 46.8 28 53.4" />
          {/* Bicepsens muskelbukar */}
          <path d="M25.2 58C24.2 63.8 23.6 69.2 23.2 74.6" />
          {/* Revben / serratus */}
          <path d="M40.8 62.4C38.4 63.8 36.4 65.6 34.8 67.8" />
          <path d="M41.2 69.6C38.8 70.8 36.6 72.4 34.8 74.4" />
          {/* Ljumsklinje */}
          <path d="M42.8 84C40.4 89.6 36.6 94.4 31.6 98.4" />
          {/* Lårets muskelbukar */}
          <path d="M31.6 100.6C30 108.4 30.2 116.4 32.2 124.6C33 128 34 130.6 35.2 132.4" />
          <path d="M39.8 102.6C38.4 110.6 37.6 118.4 37.4 126C37.3 128.6 37.4 130.6 37.6 132" />
        </>
      ) : (
        <>
          {/* Nackens senstråk */}
          <path d="M45.6 25.6C44.9 30.6 45 35.4 45.9 40.2" />
          {/* Deltoidens delning */}
          <path d="M31.4 34C30.2 40.4 29 46.8 28 53.4" />
          {/* Tricepsens muskelbukar */}
          <path d="M25 56C24 62 23.4 68 23.2 74" />
          {/* Teres / skulderbladets nedre kant */}
          <path d="M31.6 47.6C33.6 52.6 37 57.4 41.8 61.8" />
          {/* Ländryggens övre båge */}
          <path d="M43.4 90.6C40.4 90.2 37.6 88.8 35.2 86.6" />
          {/* Baksida lårets delning */}
          <path d="M36.6 114.2C36.4 121 36.4 127.6 36.8 134.6" />
        </>
      )}
    </g>
  )
}

function Figure({
  view,
  toneOf,
  x,
  label,
  maskId,
}: ToneProps & { view: View; x: number; label: string; maskId: string }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <g mask={`url(#${maskId})`}>
        <rect x="0" y="0" width={FIGURE_W} height={FIGURE_H} fill={BODY_BASE} />
        <g stroke={SEPARATOR} strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round">
          <MusclesHalf view={view} toneOf={toneOf} />
          <g transform={MIRROR}>
            <MusclesHalf view={view} toneOf={toneOf} />
          </g>
        </g>
        <DetailsHalf view={view} />
        <g transform={MIRROR}>
          <DetailsHalf view={view} />
        </g>
      </g>
      <text
        x="50"
        y="193.5"
        textAnchor="middle"
        fontFamily={CAPTION_FONT}
        fontSize="6.2"
        fontWeight="600"
        letterSpacing="0.25"
        fill={CAPTION}
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
  // Unikt id så flera kartor kan ligga på samma sida utan att masken krockar.
  const maskId = `mm-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

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
      <svg viewBox="0 0 214 200" className="w-full h-auto" aria-hidden="true" focusable="false">
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={FIGURE_W}
            height={FIGURE_H}
          >
            <SilhouetteHalf />
            <g transform={MIRROR}>
              <SilhouetteHalf />
            </g>
          </mask>
        </defs>
        <Figure view="front" toneOf={toneOf} x={0} label="Framsida" maskId={maskId} />
        <Figure view="back" toneOf={toneOf} x={114} label="Baksida" maskId={maskId} />
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
