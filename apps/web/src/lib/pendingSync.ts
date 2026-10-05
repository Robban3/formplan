/**
 * Delade byggdelar för offline-flushen i weightStore och measurementStore.
 *
 * Varför filen finns: vattenloggen och träningspassen har sedan länge en kö som
 * skickar om det som loggats utan nät. Vikt och kroppsmått hade ingen — de
 * speglade till servern med `.catch(() => {})` och gav upp. En vikt loggad
 * offline låg kvar i den webbläsarens localStorage för alltid, och försvann vid
 * byte av enhet eller ominstallation.
 *
 * Kön ligger HÄR och inte i vardera lager eftersom de två behöver exakt samma
 * logik. Två kopior av en synkkö är två ställen den kan glida isär.
 */

/**
 * Prefix som märker en post som ÄNNU INTE bekräftad av servern.
 *
 * Samma grepp som vattenloggen: id:t är både markör och idempotensnyckel. Det
 * skickas som `client_id`, så en re-POST efter ett förlorat svar blir en merge
 * i stället för en dubblettrad. När servern svarat byts id:t mot serverradens,
 * vilket också är det som gör att en senare flush hoppar över posten.
 */
export const PENDING_PREFIX = 'local-'

export function newPendingId(): string {
  return `${PENDING_PREFIX}${crypto.randomUUID()}`
}

export function isPending(id: string): boolean {
  return id.startsWith(PENDING_PREFIX)
}

/**
 * Datum vars borttagning ännu inte bekräftats av servern.
 *
 * Skild från tombstones, som är PERMANENTA: de hindrar att en borttagen post
 * återuppstår vid nästa servermerge och får därför aldrig rensas. Den här
 * mängden är en arbetskö och töms när servern bekräftat. Utan den fastnade en
 * borttagning som gjordes offline lokalt — raden låg kvar på servern och kom
 * tillbaka på nästa enhet användaren loggade in på.
 */
export function createPendingDeletes(storageKey: string) {
  function load(): Set<string> {
    try {
      return new Set(JSON.parse(localStorage.getItem(storageKey) ?? '[]') as string[])
    } catch {
      return new Set()
    }
  }

  function save(dates: Set<string>) {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...dates]))
    } catch {
      /* lagring blockerad — kön återskapas vid nästa borttagning */
    }
  }

  return {
    all: (): string[] => [...load()],
    add(date: string) {
      const dates = load()
      dates.add(date)
      save(dates)
    },
    done(date: string) {
      const dates = load()
      if (dates.delete(date)) save(dates)
    },
  }
}

/**
 * Gör en flush till en funktion där samtidiga anrop delar EN körning.
 *
 * Flushen triggas från flera ställen (inloggning, paywall, mer-sidan), och två
 * samtidiga körningar skulle POSTa samma väntande post två gånger innan den
 * första hunnit byta id. Samma mönster som flushLocalWater.
 */
export function once(run: () => Promise<void>): () => Promise<void> {
  let inFlight: Promise<void> | null = null
  return () => {
    if (!inFlight) {
      inFlight = run().finally(() => {
        inFlight = null
      })
    }
    return inFlight
  }
}
