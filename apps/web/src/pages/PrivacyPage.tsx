import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from '../components/ui/Icons'

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

const UPDATED = '2026-10-01'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-2">{title}</h2>
      <div className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full bg-canvas">
      <header className="sticky top-0 z-10 bg-canvas/95 backdrop-blur border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Tillbaka"
            className="p-1 -ml-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700"
          >
            <ChevronLeftIcon className="w-5 h-5 stroke-stone-600 dark:stroke-stone-300" />
          </button>
          <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100">Integritetspolicy</h1>
        </div>
      </header>

      <div className="px-5 py-6 max-w-2xl mx-auto">
        <p className="text-xs text-stone-400 dark:text-stone-500 mb-6">Senast uppdaterad: {UPDATED}</p>

        <Section title="Kort sammanfattning">
          <p>
            FormPlan sparar det du själv matar in — din profil, dina pass, din mat och dina
            mätningar — för att kunna visa din utveckling och skapa scheman åt dig. Vi säljer
            aldrig dina uppgifter och använder dem inte till annonser. Du kan när som helst
            radera ditt konto och all data i appen under <em>Mer → Profil</em>.
          </p>
        </Section>

        <Section title="Vem ansvarar för uppgifterna">
          <p>
            Personuppgiftsansvarig är Applabbet Nordic AB, org.nr 559550-0249,
            Säljåsbacken 3, 437 93 Lindome. Kontakta oss på{' '}
            <a href="mailto:support@applabbet.com" className="underline">
              support@applabbet.com
            </a>{' '}
            med frågor om dina uppgifter.
          </p>
        </Section>

        <Section title="Vad vi samlar in">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Konto:</strong> e-postadress. Loggar du in med Google får vi även namn och
              profilbild från ditt Google-konto.
            </li>
            <li>
              <strong>Träningsprofil:</strong> mål, nivå, tillgänglig utrustning, antal
              träningsdagar per vecka, eventuella allergier samt kalori- och proteinmål.
            </li>
            <li>
              <strong>Hälsouppgifter:</strong> ålder, längd, vikt och kroppsmätningar.
            </li>
            <li>
              <strong>Aktivitet:</strong> genomförda pass med övningar, set, repetitioner, vikter
              och tid; matdagbok med livsmedel och näringsvärden; vattenintag.
            </li>
            <li>
              <strong>Scheman:</strong> de tränings- och kostscheman som genereras åt dig.
            </li>
            <li>
              <strong>Prenumeration:</strong> status och identifierare hos vår betalleverantör.
              Vi tar aldrig emot och lagrar aldrig dina kortuppgifter.
            </li>
          </ul>
          <p>
            Vi använder inga annonsnätverk, spårningspixlar eller analysverktyg från tredje part,
            och samlar inte in din position.
          </p>
        </Section>

        <Section title="Varför vi behandlar uppgifterna">
          <p>
            För att leverera tjänsten du avtalat om: generera scheman, visa din historik och
            utveckling, skicka de notiser och rapporter du valt, samt hantera din prenumeration.
            Hälsouppgifter behandlas med stöd av ditt uttryckliga samtycke, som du ger genom att
            fylla i dem — och återkallar genom att radera dem eller ditt konto.
          </p>
        </Section>

        <Section title="Vilka vi delar med">
          <p>
            Endast de leverantörer som krävs för att driva tjänsten. Alla behandlar uppgifter på
            vårt uppdrag, enligt personuppgiftsbiträdesavtal.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Supabase</strong> — inloggning och databas, där dina uppgifter lagras.
            </li>
            <li>
              <strong>Cloudflare</strong> — drift av app och API.
            </li>
            <li>
              <strong>Google (Gemini)</strong> — när ett schema genereras eller du frågar
              AI-coachen skickas de uppgifter som behövs för just det: mål, nivå, utrustning,
              träningsdagar, allergier, ålder, längd, vikt och kalorimål. Din e-postadress och
              din identitet skickas inte med.
            </li>
            <li>
              <strong>Stripe</strong> — betalningar och prenumerationer. Dina kortuppgifter
              hanteras av Stripe och passerar aldrig våra servrar.
            </li>
            <li>
              <strong>Resend</strong> — utskick av e-post, till exempel veckorapporter.
            </li>
            <li>
              <strong>Open Food Facts</strong> — när du söker efter ett livsmedel eller skannar
              en streckkod skickas sökordet respektive streckkoden dit. Ingen uppgift om vem du
              är följer med.
            </li>
          </ul>
          <p>
            Vi säljer aldrig dina uppgifter och lämnar inte ut dem till någon annan, utom när lag
            kräver det.
          </p>
        </Section>

        <Section title="Var uppgifterna lagras">
          <p>
            Ditt konto och all data du matar in — profil, pass, matdagbok, mätningar och
            scheman — lagras hos Supabase i regionen EU West (Irland), alltså inom EU.
          </p>
          <p>
            Appen och API:t körs i Cloudflares globala nätverk, nära dig. En liten mängd
            driftdata kopplad till ditt användar-id (till exempel räknare som begränsar antalet
            förfrågningar) replikeras i det nätverket och kan därmed befinna sig utanför EU/EES.
          </p>
          <p>
            Våra leverantörer för betalning, e-post och AI — Stripe, Resend och Google — är
            amerikanska bolag och kan behandla uppgifter utanför EU/EES. Sådan överföring sker
            med stöd av EU-kommissionens standardavtalsklausuler.
          </p>
        </Section>

        <Section title="Hur länge vi sparar">
          <p>
            Så länge du har ett konto. Raderar du kontot tas dina uppgifter bort direkt och
            permanent — profil, pass, matdagbok, mätningar och scheman. Underlag som vi enligt
            bokföringslagen måste spara, som betalningshistorik, behålls i sju år.
          </p>
        </Section>

        <Section title="Dina rättigheter">
          <p>
            Du har rätt att få veta vilka uppgifter vi har om dig, att få dem rättade eller
            raderade, att invända mot behandlingen och att få ut dem i maskinläsbart format.
            Radering gör du enklast själv under <em>Mer → Profil → Radera konto</em>. För övriga
            frågor, kontakta{' '}
            <a href="mailto:support@applabbet.com" className="underline">
              support@applabbet.com
            </a>
            .
          </p>
          <p>
            Är du missnöjd med hur vi hanterar dina uppgifter kan du klaga hos
            Integritetsskyddsmyndigheten (imy.se).
          </p>
        </Section>

        <Section title="Barn">
          <p>
            FormPlan riktar sig inte till barn under 13 år, och vi samlar inte medvetet in
            uppgifter om dem.
          </p>
        </Section>

        <Section title="Inte medicinsk rådgivning">
          <p>
            Scheman och rekommendationer i appen är automatiskt genererade och ersätter inte
            råd från läkare, dietist eller annan vårdpersonal. Rådgör med vården innan du ändrar
            kost eller träning om du har en sjukdom, är gravid eller tar mediciner.
          </p>
        </Section>

        <Section title="Ändringar">
          <p>
            Ändrar vi den här policyn uppdaterar vi datumet överst. Vid väsentliga ändringar
            meddelar vi dig i appen eller via e-post.
          </p>
        </Section>
      </div>
    </div>
  )
}
