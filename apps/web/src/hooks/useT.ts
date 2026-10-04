import { useSettings } from './useSettings'
import {
  resolveLang,
  deviceLanguages,
  translatorFor,
  localeFor,
  type Lang,
  type TranslateFn,
} from '../lib/i18n'

/**
 * Översättning i en komponent.
 *
 * `lang` returneras också, för de ställen som behöver formatera datum eller
 * tal efter språket snarare än slå upp en sträng.
 */
export function useT(): { t: TranslateFn; lang: Lang; locale: string } {
  const { language } = useSettings()
  const lang = resolveLang(language, deviceLanguages())
  // `locale` går till toLocaleDateString/toLocaleString. Hårdkodat 'sv-SE' gav
  // "Söndag 4 Oktober" i den engelska appen.
  return { t: translatorFor(lang), lang, locale: localeFor(lang) }
}
