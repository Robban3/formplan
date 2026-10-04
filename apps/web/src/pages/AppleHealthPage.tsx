import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, HeartIcon } from '../components/ui/Icons'
import { useT } from '../hooks/useT'

export function AppleHealthPage() {
  const { t } = useT()
  const navigate = useNavigate()
  return (
    <div className="px-5 pt-header pb-4">
      <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-sm mb-4">
        <ChevronLeftIcon className="w-4 h-4 stroke-stone-500 dark:stroke-stone-400" />
        Mer
      </button>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">{t('more.appleHealth')}</h1>

      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/25 flex items-center justify-center mx-auto">
          <HeartIcon className="w-8 h-8 stroke-red-500" />
        </div>
        <p className="font-semibold text-stone-800 dark:text-stone-200">{t('health.comingInApp')}</p>
        <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
          {t('health.webNotice')}
        </p>
      </div>

      <div className="bg-forest-50 dark:bg-forest-900/30 rounded-2xl border border-forest-100 dark:border-forest-800 p-4 mt-4 space-y-2">
        <p className="font-medium text-forest-800 dark:text-forest-200 text-sm">{t('health.whatSyncs')}</p>
        <ul className="text-forest-800 dark:text-forest-300 text-sm space-y-1">
          <li>{t('health.sync1')}</li>
          <li>{t('health.sync2')}</li>
          <li>{t('health.sync3')}</li>
          <li>{t('health.sync4')}</li>
        </ul>
      </div>
    </div>
  )
}
