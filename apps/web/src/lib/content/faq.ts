/**
 * Vanliga frågor, per språk.
 *
 * Ligger HÄR och inte i lib/i18n: ordlistan är för korta
 * gränssnittssträngar, och trettioåtta stycken löptext hade dränkt den.
 * Samma uppdelning gäller all längre text — policy, villkor, hjälpavsnitt.
 *
 * Innehållet beskriver vad appen FAKTISKT gör. Två fel rättades när texten
 * flyttades hit:
 *
 * - Svaret om att radera kontot hänvisade till mejl, trots att funktionen
 *   finns i appen (Mer → Radera konto). Apple kräver radering i appen, så en
 *   hänvisning till support kan läsas som att den saknas.
 * - Supportadressen var support@formplan.app här men support@applabbet.com i
 *   integritetspolicyn. Policyn namnger den juridiska parten, så den gäller.
 */

import type { Lang } from '../i18n'

export interface Faq {
  q: string
  a: string
}

export interface FaqSection {
  label: string
  faqs: Faq[]
}

/** Adressen som står i integritetspolicyn — en enda sanning. */
export const SUPPORT_EMAIL = 'support@applabbet.com'

const SV: FaqSection[] = [
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
        a: 'Gå till Mer → Inställningar. Under "Kost & hälsa" kan du justera ditt dagliga kalori- och proteinmål.',
      },
      {
        q: 'Vad är snabbval i kostdagboken?',
        a: 'Snabbval visar de livsmedel du loggar oftast. Ju fler gånger du loggar ett livsmedel, desto högre upp hamnar det i listan.',
      },
      {
        q: 'Vad händer om streckkoden inte finns i databasen?',
        a: 'Då får du skriva av näringsdeklarationen en gång. Varan sparas på din telefon och fylls i automatiskt nästa gång du skannar samma kod.',
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
        a: 'Gå till Analys-fliken → Trender och tryck på "Logga vikt". Din vikthistorik visas som en graf med ett rullande 7-dagarsmedelvärde.',
      },
      {
        q: 'Hur loggar jag kroppsmått?',
        a: 'Gå till Mer → Kroppsmätningar. Du kan logga midja, höfter, bröst, lår och armar och följa din utveckling över tid.',
      },
      {
        q: 'Kan jag byta till pund och tum?',
        a: 'Ja — Mer → Inställningar → Enheter. Vikter, vatten, kroppsmått och distanser visas då i lbs, fl oz, tum och miles. Din historik räknas om; inget behöver matas in igen.',
      },
      {
        q: 'Kan jag byta språk?',
        a: 'Appen följer telefonens språk som standard och finns på svenska och engelska. Du kan välja språk själv under Mer → Inställningar → Språk.',
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
        a: 'Gå till Mer och tryck på "Radera konto" längst ner. Du får bekräfta två gånger, och därefter tas kontot och all din data bort direkt och permanent. Behöver du hjälp går det också att mejla ' + SUPPORT_EMAIL + '.',
      },
      {
        q: 'Hur kontaktar jag support?',
        a: 'Skicka ett mejl till ' + SUPPORT_EMAIL + ' så svarar vi inom 24 timmar på vardagar.',
      },
    ],
  },
]

const EN: FaqSection[] = [
  {
    label: 'Training',
    faqs: [
      {
        q: 'How do I create a new training plan?',
        a: 'Go to the Training tab and tap "Generate plan". The AI builds a personal program from your goals, your experience and the equipment you have. It takes 15–30 seconds.',
      },
      {
        q: 'How do I log a workout?',
        a: 'Tap a workout in the Training tab, then "Start workout". Enter weight and reps per set and tap the check button when the set is done. The workout is saved automatically when you tap "Finish workout".',
      },
      {
        q: 'Can I log workouts that aren’t in my plan?',
        a: 'Yes — go to Training → My workouts and build a custom workout with the exercises you want.',
      },
      {
        q: 'What is RPE, and why does it appear after a workout?',
        a: 'RPE (Rate of Perceived Exertion) is a 1–10 scale for how hard the session felt. Your rating helps the app understand your training load over time.',
      },
      {
        q: 'Why don’t my logged workouts show up in Analytics?',
        a: 'Data appears as soon as a workout is finished. Check that you tapped "Finish workout" and that at least one set was marked as done.',
      },
      {
        q: 'How do personal bests work?',
        a: 'The app estimates your 1RM (one-rep max) with the Epley formula: weight × (1 + reps/30). Every time you beat your previous record, a notice appears during the workout.',
      },
    ],
  },
  {
    label: 'Nutrition',
    faqs: [
      {
        q: 'How do I log food?',
        a: 'Go to the Nutrition tab. Tap "Add food" under the meal you want — breakfast, lunch, dinner or snack — search for the food, pick an amount and confirm.',
      },
      {
        q: 'How do I create my own meal?',
        a: 'In the food search, open the "Meals" tab and tap "Create your own meal". Add ingredients and give the meal a name. It’s saved on your device and can be logged with one tap.',
      },
      {
        q: 'How do I change my calorie or protein target?',
        a: 'Go to More → Settings. Under "Nutrition & health" you can adjust your daily calorie and protein targets.',
      },
      {
        q: 'What are quick picks in the food diary?',
        a: 'Quick picks show the foods you log most often. The more times you log a food, the higher it appears in the list.',
      },
      {
        q: 'What if a barcode isn’t in the database?',
        a: 'You enter the nutrition label once. The product is saved on your phone and filled in automatically the next time you scan the same code.',
      },
    ],
  },
  {
    label: 'Profile & settings',
    faqs: [
      {
        q: 'Can I change my goals after onboarding?',
        a: 'Yes — go to More → Profile and update your details. Then generate a new training plan to get a program that matches your new goals.',
      },
      {
        q: 'How do I log my weight?',
        a: 'Go to the Analytics tab → Trends and tap "Log weight". Your weight history is shown as a graph with a rolling 7-day average.',
      },
      {
        q: 'How do I log body measurements?',
        a: 'Go to More → Body measurements. You can log waist, hips, chest, thighs and arms, and follow your progress over time.',
      },
      {
        q: 'Can I switch to pounds and inches?',
        a: 'Yes — More → Settings → Units. Weights, water, body measurements and distances then show in lbs, fl oz, inches and miles. Your history is converted; nothing needs re-entering.',
      },
      {
        q: 'Can I change the language?',
        a: 'The app follows your phone’s language by default and is available in Swedish and English. You can choose the language yourself under More → Settings → Language.',
      },
      {
        q: 'Does the app work offline?',
        a: 'Yes, the core features — workout logging and the food diary — work offline. Data syncs automatically once you’re back online.',
      },
    ],
  },
  {
    label: 'Account & other',
    faqs: [
      {
        q: 'What’s included in the free version?',
        a: 'The free version includes an AI-generated training plan, the full food diary, weight tracking, goals and challenges, and the AI coach.',
      },
      {
        q: 'What is premium?',
        a: 'Premium gives you unlimited AI-generated plans, priority generation, and premium-only features as they launch.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to More and tap "Delete account" at the bottom. You confirm twice, and your account and all your data are then removed immediately and permanently. If you need help, you can also email ' + SUPPORT_EMAIL + '.',
      },
      {
        q: 'How do I contact support?',
        a: 'Email ' + SUPPORT_EMAIL + ' and we’ll reply within 24 hours on weekdays.',
      },
    ],
  },
]

export function faqSections(lang: Lang): FaqSection[] {
  return lang === 'sv' ? SV : EN
}
