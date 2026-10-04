/**
 * Integritetspolicyn, per språk.
 *
 * ⚠️ JURIDISK TEXT. Den engelska versionen är en översättning av den svenska
 * och bör läsas av en människa innan den publiceras — en felformulerad
 * mening om hälsodata är inte ett skönhetsfel. Svenska är originalet och
 * gäller vid tvist; det står i policyn själv (`governingLanguage`).
 *
 * Innehållet beskriver vad koden FAKTISKT gör: tabellerna i Supabase, de
 * utgående anropen i apps/api och betalflödet. Ändras något av det måste
 * BÅDA språken ändras med.
 *
 * Strukturen är data, inte markup: avsnitt med stycken och punktlistor.
 * PrivacyPage renderar den. Det gör att samma text kan återanvändas på webben
 * om policyn behöver ligga på en publik URL utan appens ramverk.
 */

import type { Lang } from '../i18n'

/** Den juridiska parten. Samma på båda språken. */
export const CONTROLLER = {
  name: 'Applabbet Nordic AB',
  orgNr: '559550-0249',
  address: 'Säljåsbacken 3, 437 93 Lindome',
  email: 'support@applabbet.com',
}

export const UPDATED = '2026-10-04'

export interface Bullet {
  /** Fetstilt inledning, t.ex. "Konto:". */
  term?: string
  text: string
}

export interface PrivacySection {
  title: string
  paragraphs?: string[]
  bullets?: Bullet[]
  /** Stycken som kommer EFTER punktlistan. */
  after?: string[]
}

export interface PrivacyContent {
  updatedLabel: string
  governingLanguage: string
  sections: PrivacySection[]
}

const SV: PrivacyContent = {
  updatedLabel: 'Senast uppdaterad',
  governingLanguage:
    'Den svenska versionen av denna policy är originalet. Vid skillnader mellan språkversionerna gäller den svenska.',
  sections: [
    {
      title: 'Kort sammanfattning',
      paragraphs: [
        'FormPlan sparar det du själv matar in — din profil, dina pass, din mat och dina mätningar — för att kunna visa din utveckling och skapa scheman åt dig. Vi säljer aldrig dina uppgifter och använder dem inte till annonser. Du kan när som helst radera ditt konto och all data i appen under Mer → Radera konto.',
      ],
    },
    {
      title: 'Vem ansvarar för uppgifterna',
      paragraphs: [
        `Personuppgiftsansvarig är ${CONTROLLER.name}, org.nr ${CONTROLLER.orgNr}, ${CONTROLLER.address}. Kontakta oss på ${CONTROLLER.email} med frågor om dina uppgifter.`,
      ],
    },
    {
      title: 'Vad vi samlar in',
      bullets: [
        { term: 'Konto:', text: 'e-postadress. Loggar du in med Google får vi även namn och profilbild från ditt Google-konto.' },
        { term: 'Träningsprofil:', text: 'mål, nivå, tillgänglig utrustning, antal träningsdagar per vecka, eventuella allergier samt kalori- och proteinmål.' },
        { term: 'Hälsouppgifter:', text: 'ålder, längd, vikt och kroppsmätningar.' },
        { term: 'Aktivitet:', text: 'genomförda pass med övningar, set, repetitioner, vikter och tid; matdagbok med livsmedel och näringsvärden; vattenintag.' },
        { term: 'Scheman:', text: 'de tränings- och kostscheman som genereras åt dig.' },
        { term: 'Prenumeration:', text: 'status och identifierare hos vår betalleverantör. Vi tar aldrig emot och lagrar aldrig dina kortuppgifter.' },
      ],
      after: [
        'Vi använder inga annonsnätverk, spårningspixlar eller analysverktyg från tredje part, och samlar inte in din position.',
      ],
    },
    {
      title: 'Varför vi behandlar uppgifterna',
      paragraphs: [
        'För att leverera tjänsten du avtalat om: generera scheman, visa din historik och utveckling, skicka de notiser och rapporter du valt, samt hantera din prenumeration. Hälsouppgifter behandlas med stöd av ditt uttryckliga samtycke, som du ger genom att fylla i dem — och återkallar genom att radera dem eller ditt konto.',
      ],
    },
    {
      title: 'Vilka vi delar med',
      paragraphs: [
        'Endast de leverantörer som krävs för att driva tjänsten. Alla behandlar uppgifter på vårt uppdrag, enligt personuppgiftsbiträdesavtal.',
      ],
      bullets: [
        { term: 'Supabase', text: '— inloggning och databas, där dina uppgifter lagras.' },
        { term: 'Cloudflare', text: '— drift av app och API.' },
        { term: 'Google (Gemini)', text: '— när ett schema genereras eller du frågar AI-coachen skickas de uppgifter som behövs för just det: mål, nivå, utrustning, träningsdagar, allergier, ålder, längd, vikt och kalorimål. Din e-postadress och din identitet skickas inte med.' },
        { term: 'Stripe', text: '— betalningar och prenumerationer. Dina kortuppgifter hanteras av Stripe och passerar aldrig våra servrar.' },
        { term: 'Resend', text: '— utskick av e-post, till exempel veckorapporter.' },
        { term: 'Open Food Facts', text: '— när du söker efter ett livsmedel eller skannar en streckkod skickas sökordet respektive streckkoden dit. Ingen uppgift om vem du är följer med.' },
      ],
      after: [
        'Vi säljer aldrig dina uppgifter och lämnar inte ut dem till någon annan, utom när lag kräver det.',
      ],
    },
    {
      title: 'Var uppgifterna lagras',
      paragraphs: [
        'Ditt konto och all data du matar in — profil, pass, matdagbok, mätningar och scheman — lagras hos Supabase i regionen EU West (Irland), alltså inom EU.',
        'Appen och API:t körs i Cloudflares globala nätverk, nära dig. En liten mängd driftdata kopplad till ditt användar-id (till exempel räknare som begränsar antalet förfrågningar) replikeras i det nätverket och kan därmed befinna sig utanför EU/EES.',
        'Våra leverantörer för betalning, e-post och AI — Stripe, Resend och Google — är amerikanska bolag och kan behandla uppgifter utanför EU/EES. Sådan överföring sker med stöd av EU-kommissionens standardavtalsklausuler.',
      ],
    },
    {
      title: 'Hur länge vi sparar',
      paragraphs: [
        'Så länge du har ett konto. Raderar du kontot tas dina uppgifter bort direkt och permanent — profil, pass, matdagbok, mätningar och scheman. Underlag som vi enligt bokföringslagen måste spara, som betalningshistorik, behålls i sju år.',
      ],
    },
    {
      title: 'Dina rättigheter',
      paragraphs: [
        `Du har rätt att få veta vilka uppgifter vi har om dig, att få dem rättade eller raderade, att invända mot behandlingen och att få ut dem i maskinläsbart format. Radering gör du enklast själv under Mer → Radera konto. För övriga frågor, kontakta ${CONTROLLER.email}.`,
        'Är du missnöjd med hur vi hanterar dina uppgifter kan du klaga hos Integritetsskyddsmyndigheten (imy.se).',
      ],
    },
    {
      title: 'Barn',
      paragraphs: [
        'FormPlan riktar sig inte till barn under 13 år, och vi samlar inte medvetet in uppgifter om dem.',
      ],
    },
    {
      title: 'Inte medicinsk rådgivning',
      paragraphs: [
        'Scheman och rekommendationer i appen är automatiskt genererade och ersätter inte råd från läkare, dietist eller annan vårdpersonal. Rådgör med vården innan du ändrar kost eller träning om du har en sjukdom, är gravid eller tar mediciner.',
      ],
    },
    {
      title: 'Ändringar',
      paragraphs: [
        'Ändrar vi den här policyn uppdaterar vi datumet överst. Vid väsentliga ändringar meddelar vi dig i appen eller via e-post.',
      ],
    },
  ],
}

const EN: PrivacyContent = {
  updatedLabel: 'Last updated',
  governingLanguage:
    'The Swedish version of this policy is the original. If the language versions differ, the Swedish version prevails.',
  sections: [
    {
      title: 'In short',
      paragraphs: [
        'FormPlan stores what you enter yourself — your profile, your workouts, your food and your measurements — so it can show your progress and build plans for you. We never sell your data and never use it for advertising. You can delete your account and all your data at any time, in the app under More → Delete account.',
      ],
    },
    {
      title: 'Who is responsible for your data',
      paragraphs: [
        `The data controller is ${CONTROLLER.name}, company reg. no. ${CONTROLLER.orgNr}, ${CONTROLLER.address}, Sweden. Contact us at ${CONTROLLER.email} with any questions about your data.`,
      ],
    },
    {
      title: 'What we collect',
      bullets: [
        { term: 'Account:', text: 'your email address. If you sign in with Google, we also receive your name and profile picture from your Google account.' },
        { term: 'Training profile:', text: 'goal, level, available equipment, training days per week, any allergies, and calorie and protein targets.' },
        { term: 'Health data:', text: 'age, height, weight and body measurements.' },
        { term: 'Activity:', text: 'completed workouts with exercises, sets, reps, weights and duration; your food diary with foods and nutrition values; water intake.' },
        { term: 'Plans:', text: 'the training and nutrition plans generated for you.' },
        { term: 'Subscription:', text: 'status and identifiers held by our payment provider. We never receive or store your card details.' },
      ],
      after: [
        'We use no ad networks, tracking pixels or third-party analytics, and we do not collect your location.',
      ],
    },
    {
      title: 'Why we process your data',
      paragraphs: [
        'To deliver the service you signed up for: generating plans, showing your history and progress, sending the notifications and reports you chose, and managing your subscription. Health data is processed on the basis of your explicit consent, which you give by entering it — and withdraw by deleting it or your account.',
      ],
    },
    {
      title: 'Who we share it with',
      paragraphs: [
        'Only the providers needed to run the service. All of them process data on our behalf, under data processing agreements.',
      ],
      bullets: [
        { term: 'Supabase', text: '— sign-in and database, where your data is stored.' },
        { term: 'Cloudflare', text: '— hosting for the app and the API.' },
        { term: 'Google (Gemini)', text: '— when a plan is generated or you ask the AI coach, we send only what is needed for that: goal, level, equipment, training days, allergies, age, height, weight and calorie target. Your email address and your identity are not included.' },
        { term: 'Stripe', text: '— payments and subscriptions. Your card details are handled by Stripe and never pass through our servers.' },
        { term: 'Resend', text: '— sending email, for example weekly reports.' },
        { term: 'Open Food Facts', text: '— when you search for a food or scan a barcode, the search term or the barcode is sent there. Nothing identifying you is included.' },
      ],
      after: [
        'We never sell your data and do not disclose it to anyone else, except where the law requires it.',
      ],
    },
    {
      title: 'Where your data is stored',
      paragraphs: [
        'Your account and everything you enter — profile, workouts, food diary, measurements and plans — is stored with Supabase in the EU West (Ireland) region, that is, within the EU.',
        'The app and the API run on Cloudflare’s global network, close to you. A small amount of operational data tied to your user id (for example counters that limit request rates) is replicated across that network and may therefore sit outside the EU/EEA.',
        'Our providers for payment, email and AI — Stripe, Resend and Google — are US companies and may process data outside the EU/EEA. Such transfers rely on the European Commission’s standard contractual clauses.',
      ],
    },
    {
      title: 'How long we keep it',
      paragraphs: [
        'For as long as you have an account. If you delete your account, your data is removed immediately and permanently — profile, workouts, food diary, measurements and plans. Records we are required to keep under Swedish accounting law, such as payment history, are retained for seven years.',
      ],
    },
    {
      title: 'Your rights',
      paragraphs: [
        `You have the right to know what data we hold about you, to have it corrected or erased, to object to the processing, and to receive it in a machine-readable format. The easiest way to erase it is yourself, under More → Delete account. For anything else, contact ${CONTROLLER.email}.`,
        'If you are unhappy with how we handle your data, you can complain to the Swedish Authority for Privacy Protection (imy.se).',
      ],
    },
    {
      title: 'Children',
      paragraphs: [
        'FormPlan is not directed at children under 13, and we do not knowingly collect data about them.',
      ],
    },
    {
      title: 'Not medical advice',
      paragraphs: [
        'The plans and recommendations in the app are generated automatically and do not replace advice from a doctor, dietitian or other healthcare professional. Consult healthcare before changing your diet or training if you have a medical condition, are pregnant or take medication.',
      ],
    },
    {
      title: 'Changes',
      paragraphs: [
        'If we change this policy we will update the date at the top. For material changes we will notify you in the app or by email.',
      ],
    },
  ],
}

export function privacyContent(lang: Lang): PrivacyContent {
  return lang === 'sv' ? SV : EN
}
