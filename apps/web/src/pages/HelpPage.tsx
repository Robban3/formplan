import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, ChevronDownIcon, ChevronUpIcon } from '../components/ui/Icons'

interface FAQ { q: string; a: string }

const SECTIONS: { label: string; faqs: FAQ[] }[] = [
  {
    label: 'Träning',
    faqs: [
      {
        q: 'Hur skapar jag ett nytt träningsschema?',
        a: 'Gå till fliken Träning och tryck på "Generera schema". AI:n skapar ett personligt program baserat på dina mål, din erfarenhet och tillgänglig utrustning. Det tar 15–30 sekunder.',
      },
      {
        q: 'Hur loggar jag ett träningspass?',
        a: 'Tryck på ett pass i Träning-fliken och sedan "Starta pass". Fyll i vikt och reps per set och tryck på bockknappen när setet är klart. Passet sparas automatiskt när du avslutar med "Avsluta pass".',
      },
      {
        q: 'Kan jag logga egna pass som inte finns i schemat?',
        a: 'Ja — gå till Träning → Egna pass och skapa ett anpassat pass med de övningar du vill ha.',
      },
      {
        q: 'Vad är RPE och varför visas det efter ett pass?',
        a: 'RPE (Rate of Perceived Exertion) är en skala 1–10 som mäter hur ansträngande passet kändes. Din rating hjälper appen att förstå din träningsbelastning över tid.',
      },
      {
        q: 'Varför syns inte mina loggade pass i Analys?',
        a: 'Data dyker upp direkt efter att ett pass avslutats. Kontrollera att du tryckte "Avsluta pass" och att minst ett set var markerat som klart.',
      },
      {
        q: 'Hur fungerar personbästa (PB)?',
        a: 'Appen beräknar ett uppskattat 1RM (max en repetition) med Epley-formeln baserat på vikt × (1 + reps/30). Varje gång du slår ditt tidigare rekord visas en notis direkt under passet.',
      },
    ],
  },
  {
    label: 'Kost',
    faqs: [
      {
        q: 'Hur loggar jag mat?',
        a: 'Gå till Kost-fliken. Tryck "Lägg till mat" under önskad måltid — frukost, lunch, middag eller mellanmål — sök efter livsmedlet, välj mängd och bekräfta.',
      },
      {
        q: 'Hur skapar jag en egen måltid?',
        a: 'I livsmedelssökningen, välj fliken "Måltider" och tryck på "Skapa egen måltid". Lägg till ingredienser och ge måltiden ett namn. Den sparas sedan lokalt och kan loggas med ett klick.',
      },
      {
        q: 'Hur ändrar jag mitt kalori- eller proteinmål?',
        a: 'Gå till Mer → Inställningar. Under "Kostmål" kan du justera ditt dagliga kalori- och makromål.',
      },
      {
        q: 'Vad är snabbval i kostdagboken?',
        a: 'Snabbval visar de livsmedel du loggar oftast. Ju fler gånger du loggar ett livsmedel, desto högre upp hamnar det i listan.',
      },
    ],
  },
  {
    label: 'Profil & inställningar',
    faqs: [
      {
        q: 'Kan jag byta mina mål efter onboarding?',
        a: 'Ja — gå till Mer → Profil och uppdatera dina uppgifter. Generera sedan ett nytt träningsschema för att få ett uppdaterat program som matchar dina nya mål.',
      },
      {
        q: 'Hur loggar jag min vikt?',
        a: 'Gå till Analys-fliken → Vikt och tryck på "+". Din vikthistorik visas som en graf med ett rullande 7-dagarsmedelvärde.',
      },
      {
        q: 'Hur loggar jag kroppsmått?',
        a: 'Gå till Mer → Kroppsmätningar. Du kan logga midja, höfter, bröst, lår och armar och följa din utveckling över tid.',
      },
      {
        q: 'Fungerar appen offline?',
        a: 'Ja, grundfunktionerna — träningsloggning och kostdagbok — fungerar offline. Data synkroniseras automatiskt när du är online igen.',
      },
    ],
  },
  {
    label: 'Konto & övrigt',
    faqs: [
      {
        q: 'Vad ingår i gratisversionen?',
        a: 'Gratisversionen inkluderar ett AI-genererat träningsschema, full kostdagbok, viktspårning, mål och utmaningar samt AI-coachen.',
      },
      {
        q: 'Vad är premium?',
        a: 'Med premium får du obegränsat antal AI-genererade scheman, prioriterad generering och exklusiva premium-funktioner som lanseras framöver.',
      },
      {
        q: 'Hur tar jag bort mitt konto?',
        a: 'Kontakta oss på support@formplan.app så tar vi bort ditt konto och all din data inom 30 dagar.',
      },
      {
        q: 'Hur kontaktar jag support?',
        a: 'Skicka ett mejl till support@formplan.app så svarar vi inom 24 timmar på vardagar.',
      },
    ],
  },
]

export function HelpPage() {
  const navigate = useNavigate()
  const [open, setOpen] = useState<string | null>(null)

  function toggle(key: string) {
    setOpen(open === key ? null : key)
  }

  return (
    <div className="px-5 pt-header pb-10">
      <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-400 text-sm mb-4">
        <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
        Mer
      </button>
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Hjälp & support</h1>
      <p className="text-stone-400 text-sm mb-6">Vanliga frågor och svar.</p>

      <div className="space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
              {section.label}
            </p>
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
              {section.faqs.map((faq, i) => {
                const key = `${section.label}-${i}`
                const isOpen = open === key
                return (
                  <div key={i} className={i > 0 ? 'border-t border-stone-100' : ''}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-4 py-4 text-left"
                    >
                      <span className="font-medium text-stone-800 text-sm pr-3">{faq.q}</span>
                      {isOpen
                        ? <ChevronUpIcon className="w-4 h-4 stroke-stone-400 flex-shrink-0" />
                        : <ChevronDownIcon className="w-4 h-4 stroke-stone-300 flex-shrink-0" />
                      }
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <p className="text-stone-500 text-sm leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 p-5 mt-6 text-center">
        <p className="font-medium text-stone-700 text-sm mb-1">Hittar du inte svaret?</p>
        <p className="text-stone-400 text-xs mb-3">Vi svarar inom 24 timmar på vardagar.</p>
        <a
          href="mailto:support@formplan.app"
          className="inline-block bg-forest-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
        >
          Kontakta support
        </a>
      </div>
    </div>
  )
}
