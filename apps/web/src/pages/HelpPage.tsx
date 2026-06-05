import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/ui/Icons'

interface FAQ { q: string; a: string }

const FAQS: FAQ[] = [
  {
    q: 'Hur skapar jag ett nytt schema?',
    a: 'Gå till fliken Träning och tryck på "Skapa nytt pass". AI:n genererar ett personligt 7-dagarsschema baserat på din profil. Det tar ungefär 15–30 sekunder.',
  },
  {
    q: 'Kan jag byta mina mål efter onboarding?',
    a: 'Ja — gå till Mer → Profil → Uppdatera mina uppgifter. Generera sedan ett nytt schema för att få ett uppdaterat program.',
  },
  {
    q: 'Hur loggar jag ett träningspass?',
    a: 'Tryck på ett pass i Träning-fliken, sedan "Starta pass". Fyll i vikt och reps per set och tryck på bockknappen. Passet sparas automatiskt när du avslutar.',
  },
  {
    q: 'Varför syns inte mina loggade pass i Analys?',
    a: 'Data dyker upp direkt efter att ett pass avslutats. Kontrollera att du tryckte "Avsluta pass" och att minst ett set var markerat som klart.',
  },
  {
    q: 'Hur loggar jag mat?',
    a: 'Gå till Kost-fliken. Tryck "Lägg till mat" under önskad måltid och sök efter livsmedlet. Välj mängd och bekräfta.',
  },
  {
    q: 'Vad är premium?',
    a: 'Gratisversionen inkluderar ett AI-genererat schema. Med premium får du obegränsat antal scheman, prioriterad AI-generering och framtida premium-funktioner.',
  },
  {
    q: 'Hur kontaktar jag support?',
    a: 'Skicka ett mejl till support@formplan.app så svarar vi inom 24 timmar.',
  },
]

export function HelpPage() {
  const navigate = useNavigate()
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="px-5 pt-12 pb-4">
      <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-400 text-sm mb-4">
        <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
        Mer
      </button>
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Hjälp & support</h1>
      <p className="text-stone-400 text-sm mb-6">Vanliga frågor och svar.</p>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {FAQS.map((faq, i) => (
          <div key={i} className={i > 0 ? 'border-t border-stone-100' : ''}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-4 text-left"
            >
              <span className="font-medium text-stone-800 text-sm pr-3">{faq.q}</span>
              <ChevronRightIcon
                className={`w-4 h-4 stroke-stone-300 flex-shrink-0 transition-transform ${open === i ? 'rotate-90' : ''}`}
              />
            </button>
            {open === i && (
              <div className="px-4 pb-4">
                <p className="text-stone-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 p-4 mt-4 text-center">
        <p className="text-stone-500 text-sm">Hittar du inte svaret?</p>
        <a
          href="mailto:support@formplan.app"
          className="text-forest-600 font-medium text-sm"
        >
          support@formplan.app
        </a>
      </div>
    </div>
  )
}
