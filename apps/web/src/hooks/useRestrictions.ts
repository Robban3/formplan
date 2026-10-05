import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

/**
 * Profilens allergier och kosthänsyn, för den LOKALA kostgeneratorn.
 *
 * Läses här och inte i generatorn: generatorn är ren och ska gå att testa utan
 * nätverk.
 *
 * `status` är hela poängen. Hooken returnerade tidigare bara listan, som
 * börjar tom och fylls när hämtningen svarar — och "tom" betyder "filtrera
 * inte". Tryckte användaren på Generera innan profilen hunnit fram fick hen en
 * matsedel UTAN filtrering: ägg och kvarg till någon som kryssat ägg och
 * laktos. Samma bugg som filtret skulle rätta, återuppstådd genom ett
 * tidsglapp.
 *
 * FAIL CLOSED vid nätverksfel. Går profilen inte att läsa vet vi inte vad som
 * ska uteslutas, och kan alltså inte filtrera rätt — då genereras ingenting.
 * Priset är att den som är offline inte kan generera matsedel, även utan
 * allergier. Det är rätt pris: ett allergen är en medicinsk risk, en utebliven
 * matsedel är en olägenhet. (Tidigare gällde motsatsen, med motiveringen att
 * en tom lista inte tömmer matsedeln — men följden var att allergenet kom
 * igenom.)
 *
 * AI-recepten går en annan väg: där hämtar API:t allergierna ur profilen
 * serversidan och struntar i klientens lista, så den här hooken behövs inte
 * för dem.
 */
export type RestrictionsStatus = 'loading' | 'ready' | 'failed'

export interface Restrictions {
  restrictions: string[]
  status: RestrictionsStatus
  /** Säkert att generera? Endast 'ready' betyder att hänsynen är kända. */
  ready: boolean
  /** Försök hämta igen efter ett nätverksfel. */
  retry: () => void
}

export function useRestrictions(): Restrictions {
  const [restrictions, setRestrictions] = useState<string[]>([])
  const [status, setStatus] = useState<RestrictionsStatus>('loading')
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    setStatus('loading')
    setAttempt((n) => n + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    api
      .getProfile()
      .then(({ profile }) => {
        if (cancelled) return
        const p = profile as { allergies?: string[] } | null
        setRestrictions(p?.allergies ?? [])
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('failed')
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  return { restrictions, status, ready: status === 'ready', retry }
}
