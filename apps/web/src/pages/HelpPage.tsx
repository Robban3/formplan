import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, ChevronDownIcon, ChevronUpIcon } from '../components/ui/Icons'
import { useT } from '../hooks/useT'
import { faqSections, SUPPORT_EMAIL } from '../lib/content/faq'

export function HelpPage() {
  const { t, lang } = useT()
  const SECTIONS = faqSections(lang)
  const navigate = useNavigate()
  const [open, setOpen] = useState<string | null>(null)

  function toggle(key: string) {
    setOpen(open === key ? null : key)
  }

  return (
    <div className="px-5 pt-header pb-10">
      <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-sm mb-4">
        <ChevronLeftIcon className="w-4 h-4 stroke-stone-500 dark:stroke-stone-400" />
        {t('nav.more')}
      </button>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">{t('more.help')}</h1>
      <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">{t('help.subtitle')}</p>

      <div className="space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
              {section.label}
            </p>
            <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
              {section.faqs.map((faq, i) => {
                const key = `${section.label}-${i}`
                const isOpen = open === key
                return (
                  <div key={i} className={i > 0 ? 'border-t border-stone-200 dark:border-stone-700' : ''}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-4 py-4 text-left"
                    >
                      <span className="font-medium text-stone-800 dark:text-stone-200 text-sm pr-3">{faq.q}</span>
                      {isOpen
                        ? <ChevronUpIcon className="w-4 h-4 stroke-stone-500 dark:stroke-stone-400 flex-shrink-0" />
                        : <ChevronDownIcon className="w-4 h-4 stroke-stone-300 dark:stroke-stone-600 flex-shrink-0" />
                      }
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-5 mt-6 text-center">
        <p className="font-medium text-stone-700 dark:text-stone-300 text-sm mb-1">{t('help.noAnswer')}</p>
        <p className="text-stone-500 dark:text-stone-400 text-xs mb-3">{t('help.replyTime')}</p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-block bg-forest-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
        >
          {t('help.contactSupport')}
        </a>
      </div>
    </div>
  )
}
