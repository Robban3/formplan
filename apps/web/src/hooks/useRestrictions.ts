import { useEffect, useState } from 'react'
import { api } from '../lib/api'

/**
 * Profilens allergier och kosthänsyn, för den lokala kostgeneratorn.
 *
 * Läses här och inte i generatorn: generatorn är ren och ska gå att testa utan
 * nätverk.
 *
 * `loaded` är hela poängen med hooken. Tidigare returnerade den bara listan,
 * som börjar tom och fylls när hämtningen svarar — och "tom" betyder "filtrera
 * inte". Tryckte användaren på Generera innan profilen hunnit fram fick hen en
 * matsedel UTAN allergifiltrering: ägg och kvarg till någon som kryssat ägg och
 * laktos. Samma bugg som filtret skulle rätta, återuppstådd genom ett
 * tidsglapp. Anropande sida måste blockera generering medan `loaded` är false.
 *
 * Hooken låg tidigare duplicerad i MealPlanPage och MealWeekPage. Två kopior av
 * ett villkor är två ställen där det kan glida isär.
 *
 * VID NÄTVERKSFEL blir listan tom och filtret släpper igenom allt. Det är ett
 * medvetet men diskutabelt val, ärvt härifrån: alternativet — att utesluta allt
 * otaggat — tömmer matsedeln helt för den som har en enda hänsyn. Notera att
 * följden är att en allergiker kan få sitt allergen om profilhämtningen
 * misslyckas. `loaded` sätts ändå, så användaren blockeras inte för alltid.
 */
export interface Restrictions {
  restrictions: string[]
  loaded: boolean
}

export function useRestrictions(): Restrictions {
  const [state, setState] = useState<Restrictions>({ restrictions: [], loaded: false })

  useEffect(() => {
    let cancelled = false
    api
      .getProfile()
      .then(({ profile }) => {
        if (cancelled) return
        const p = profile as { allergies?: string[] } | null
        setState({ restrictions: p?.allergies ?? [], loaded: true })
      })
      .catch(() => {
        if (!cancelled) setState({ restrictions: [], loaded: true })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
