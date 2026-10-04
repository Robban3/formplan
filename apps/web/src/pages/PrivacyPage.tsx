import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from '../components/ui/Icons'
import { privacyContent, UPDATED, type PrivacySection } from '../lib/content/privacy'
import { useT } from '../hooks/useT'

/**
 * Integritetspolicy.
 *
 * Google Play och App Store kräver båda en publik, läsbar integritetspolicy
 * innan appen får publiceras, och extra noggrant för appar som hanterar
 * hälsodata. Sidan ligger därför även på webben (app.formplan.app/integritet),
 * som är den URL som anges i butikernas formulär.
 *
 * Innehållet speglar vad koden FAKTISKT gör — tabellerna i Supabase, de
 * utgående anropen i apps/api och betalflödet. Ändras något av det måste den
 * här sidan ändras med: läggs en ny tredjepartstjänst till, eller börjar vi
 * spara något nytt, är den här filen en del av den ändringen.
 */

/**
 * Renderar ett avsnitt ur lib/content/privacy.ts. Texten är data, inte markup —
 * så samma policy kan återanvändas utanför appen om den behöver ligga på en
 * publik URL.
 */
function Section({ section }: { section: PrivacySection }) {
  return (
    <section className="mb-7">
      <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-2">{section.title}</h2>
      <div className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed space-y-2">
        {section.paragraphs?.map((para, i) => <p key={`p${i}`}>{para}</p>)}
        {section.bullets && (
          <ul className="list-disc pl-5 space-y-1">
            {section.bullets.map((b, i) => (
              <li key={`b${i}`}>
                {b.term && <strong>{b.term}</strong>}
                {b.term ? ' ' : ''}
                {b.text}
              </li>
            ))}
          </ul>
        )}
        {section.after?.map((para, i) => <p key={`a${i}`}>{para}</p>)}
      </div>
    </section>
  )
}

export function PrivacyPage() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const policy = privacyContent(lang)

  return (
    <div className="min-h-full bg-canvas">
      <header className="sticky top-0 z-10 bg-canvas/95 backdrop-blur border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            aria-label={t('onb.back')}
            className="p-1 -ml-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700"
          >
            <ChevronLeftIcon className="w-5 h-5 stroke-stone-600 dark:stroke-stone-300" />
          </button>
          <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100">{t('more.privacy')}</h1>
        </div>
      </header>

      <div className="px-5 py-6 max-w-2xl mx-auto">
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
          {policy.updatedLabel}: {UPDATED}
        </p>

        {policy.sections.map((section) => (
          <Section key={section.title} section={section} />
        ))}

        <p className="text-xs text-stone-400 dark:text-stone-500 mt-8 pt-4 border-t border-stone-200 dark:border-stone-700">
          {policy.governingLanguage}
        </p>
      </div>
    </div>
  )
}
