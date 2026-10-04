/**
 * Svenska — nyckelkällan.
 *
 * Nycklarna i den här filen definierar vilka texter som finns. `en.ts` typas
 * mot den, så en ny svensk sträng utan engelsk motsvarighet blir ett
 * kompileringsfel. Det är avsiktligt: en lucka ska stoppa bygget, inte dyka
 * upp hos en användare.
 *
 * Namngivning: `område.sak`. Platshållare skrivs `{namn}` och fylls av
 * `translate(..., { namn: värde })`.
 *
 * Nycklarna för lagrade värden (måltidsslots, mål, nivåer) speglar vad som
 * ligger i databasen. `meal.mellanmar` är felstavat — det är kolumnvärdet, och
 * rättas det slutar lagrade rader matcha.
 */

export const sv = {
  // Flikraden
  'nav.home': 'Hem',
  'nav.nutrition': 'Kost',
  'nav.training': 'Träning',
  'nav.analytics': 'Analys',
  'nav.more': 'Mer',

  // Menyn under Mer
  'more.goals': 'Mina mål',
  'more.challenges': 'Utmaningar',
  'more.aiCoach': 'AI-coach',
  'more.measurements': 'Kroppsmätningar',
  'more.recipes': 'Recept',
  'more.profile': 'Profil',
  'more.settings': 'Inställningar',
  'more.notifications': 'Notiser',
  'more.reminders': 'Påminnelser',
  'more.appleHealth': 'Apple Health',
  'more.help': 'Hjälp & support',
  'more.about': 'Om appen',
  'more.privacy': 'Integritetspolicy',

  // Flikrader inne i sidorna
  'tab.overview': 'Översikt',
  'tab.trends': 'Trender',
  'tab.calories': 'Kalorier',
  'tab.today': 'Idag',
  'tab.week': 'Vecka',
  'tab.details': 'Detaljer',
  'tab.all': 'Alla',
  'goals.tab.active': 'Aktiva mål',
  'goals.tab.past': 'Tidigare mål',

  // Sidrubriker som inte finns i menyn
  'page.customWorkouts': 'Egna pass',
  'page.myPlan': 'Mitt schema',
  'page.weekPlanning': 'Veckoplanering',
  'page.macros': 'Makro',
  'page.mealPlan': 'Kostschema',
  'page.aboutApp': 'Om FormPlan',
  'page.water': 'Vatten',

  // Prenumeration
  'billing.premiumActive': 'Premium aktivt ✓',
  'billing.thanks': 'Tack för att du stödjer FormPlan!',
  'billing.manage': 'Hantera prenumeration',
  'billing.trial': 'Provperiod',
  // Två nycklar i stället för pluralregler: appen har två språk och ett
  // räknebart ord. Ett pluralbibliotek vore mer maskineri än nytta.
  'billing.trialLeftOne': '{days} dag kvar gratis',
  'billing.trialLeftMany': '{days} dagar kvar gratis',
  'billing.trialOver': 'Provperioden är slut',
  'billing.becomePremiumHint': 'Bli Premium för att fortsätta.',
  // Priset debiteras i kronor oavsett språk.
  'billing.upgradeCta': 'Uppgradera till Premium – {price} kr/mån',
  'billing.becomePremiumCta': 'Bli Premium – {price} kr/mån',

  // Måltider
  'meal.frukost': 'Frukost',
  'meal.lunch': 'Lunch',
  'meal.middag': 'Middag',
  'meal.mellanmar': 'Mellanmål',

  // Träningsmål i profilen
  'goal.lose_weight': 'Gå ner i vikt',
  'goal.build_muscle': 'Bygga muskler',
  'goal.maintain': 'Hålla formen',
  'goal.improve_endurance': 'Förbättra kondition',

  // Erfarenhetsnivå
  'level.beginner': 'Nybörjare',
  'level.intermediate': 'Mellannivå',
  'level.advanced': 'Avancerad',

  // Kostinriktning
  // "Hög protein" och "Låg kolhydrat" var inte idiomatisk svenska; nu när
  // texten ligger på ett ställe är den lätt att rätta.
  'diet.balanced': 'Balanserat',
  'diet.high_protein': 'Proteinrikt',
  'diet.vegetarian': 'Vegetarisk',
  'diet.low_carb': 'Lågkolhydrat',
  'diet.balanced.desc': '30 % protein · 30 % fett · 40 % kolh.',
  'diet.high_protein.desc': '40 % protein · 25 % fett · 35 % kolh.',
  'diet.vegetarian.desc': 'Helt utan kött',
  'diet.low_carb.desc': '35 % protein · 45 % fett · 20 % kolh.',

  // Gemensamt
  'common.error': 'Något gick fel',
  'common.adding': 'Lägger till…',

  // Inloggning
  'auth.linkExpired': 'Länken har gått ut eller är redan använd. Begär en ny.',

  // Mål på målsidan
  'goals.trackingAutomatic': 'Automatisk spårning ✓',
  'goals.trackingManual': 'Manuellt',

  // Målförslag. Texten tolkas av goalTracker, så siffran och enheten måste
  // stå i strängen — och tolkaren måste känna igen formuleringen på båda
  // språken och i båda enhetssystemen.
  'goals.suggest.weekly3': 'Träna 3 gånger i veckan',
  'goals.suggest.weekly4': 'Träna 4 gånger i veckan',
  'goals.suggest.water.metric.high': 'Dricka 2,5 liter vatten per dag',
  'goals.suggest.water.metric.low': 'Dricka 2 liter vatten per dag',
  'goals.suggest.water.imperial.high': 'Dricka 100 fl oz vatten per dag',
  'goals.suggest.water.imperial.low': 'Dricka 80 fl oz vatten per dag',
  'goals.suggest.lose.metric': 'Gå ner 5 kg',
  'goals.suggest.lose.imperial': 'Gå ner 10 lbs',
  'goals.suggest.weigh.metric': 'Väga 75 kg',
  'goals.suggest.weigh.imperial': 'Väga 165 lbs',
  'goals.suggest.total50': 'Klara 50 pass totalt',
  'goals.suggest.run.metric': 'Springa 5 km utan paus',
  'goals.suggest.run.imperial': 'Springa 3 miles utan paus',
  'goals.suggest.pullups': 'Klara 10 pull-ups i rad',

  // Live-status för mål
  'goals.status.weekly': '{done} av {target} pass denna vecka',
  'goals.status.total': '{done} av {target} pass totalt',
  'goals.status.water': '{done} av {target} idag',
  'goals.status.weightTarget': '{current} nu · mål {target}',
  'goals.status.weightLoss': '{done} av {target} tappat',
  'goals.status.needWeight': 'Logga vikt i Analys → Trender',

  // Språkval i inställningarna
  'settings.language': 'Språk',
  'settings.languageSub': 'Följer telefonens språk som standard',
  'settings.language.auto': 'Automatiskt',
  'settings.language.sv': 'Svenska',
  'settings.language.en': 'Engelska',
} as const

/** Varje text som finns. `en.ts` måste täcka alla. */
export type TextKey = keyof typeof sv
