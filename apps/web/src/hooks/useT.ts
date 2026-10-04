import { useSettings } from './useSettings'
import { resolveLang, deviceLanguages, translatorFor, type Lang, type TranslateFn } from '../lib/i18n'

/**
 * Översättning i en komponent.
 *
 * `lang` returneras också, för de ställen som behöver formatera datum eller
 * tal efter språket snarare än slå upp en sträng.
 */
export function useT(): { t: TranslateFn; lang: Lang } {
  const { language } = useSettings()
  const lang = resolveLang(language, deviceLanguages())
  return { t: translatorFor(lang), lang }
}
