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

  // Inloggning och registrering
  'auth.neutralSignupNotice': 'Om adressen inte redan är registrerad får du ett bekräftelsemejl. Har du redan ett konto — logga in.',
  'auth.err.invalidLogin': 'Fel e-post eller lösenord. Har du precis skapat kontot behöver du först bekräfta det via mejlet.',
  'auth.err.linkInvalid': 'Länken är inte längre giltig. Begär en ny återställningslänk.',
  'auth.err.throttled': 'Vänta en liten stund innan du försöker igen.',
  'auth.err.tooMany': 'För många försök — vänta en stund och försök igen.',
  'auth.err.pwned': 'Lösenordet finns i kända dataläckor — välj ett annat.',
  'auth.err.weakPassword': 'Lösenordet uppfyller inte kraven. {detail}',
  'auth.err.linkUnverified': 'Länken kunde inte verifieras.',
  'auth.err.notConfigured': 'Inloggning är inte konfigurerad.',
  'auth.err.generic': 'Något gick fel. Försök igen.',
  'auth.err.googleFailed': 'Kunde inte öppna Google-inloggningen. Försök igen.',

  'auth.accountCreated': 'Konto skapat!',
  'auth.accountCreatedCheckMail': 'Konto skapat! Kolla din e-post och bekräfta för att logga in.',
  'auth.needEmailFirst': 'Fyll i din e-postadress först.',
  'auth.resetSent': 'Finns ett konto för adressen skickar vi en återställningslänk. Kolla inkorgen (och skräpposten).',
  'auth.passwordUpdated': 'Lösenordet är uppdaterat.',

  'auth.tagline': 'AI-genererat',
  'auth.verifyingReset': 'Verifierar återställningslänken…',
  'auth.newPassword': 'Nytt lösenord',
  'auth.newPasswordSub': 'Välj ett nytt lösenord för ditt konto.',
  'auth.saving': 'Sparar…',
  'auth.saveNewPassword': 'Spara nytt lösenord',
  'auth.createAccount': 'Skapa konto',
  'auth.welcomeBack': 'Välkommen tillbaka',
  'auth.createAccountSub': 'Kom igång på under en minut',
  'auth.signInSub': 'Logga in för att fortsätta din resa',
  'auth.openingGoogle': 'Öppnar Google…',
  'auth.continueWithGoogle': 'Fortsätt med Google',
  'auth.tabPassword': 'Lösenord',
  'auth.tabMagicLink': 'Magisk länk',
  'auth.creatingAccount': 'Skapar konto…',
  'auth.signingIn': 'Loggar in…',
  'auth.signIn': 'Logga in',
  'auth.haveAccount': 'Har du redan ett konto?',
  'auth.noAccount': 'Har du inget konto?',
  'auth.linkSent': 'Länk skickad',
  'auth.checkYourMail': 'Kolla din e-post!',
  'auth.sending': 'Skickar…',
  'auth.sendMagicLink': 'Skicka inloggningslänk',
  'auth.emailPlaceholder': 'din@epost.se',
  'auth.passwordPlaceholder': 'Lösenord',
  'auth.forgotPassword': 'Glömt lösenordet?',
  'auth.or': 'eller',
  'auth.secureNotice': 'Säker och krypterad inloggning',
  'auth.newPasswordPlaceholder': 'Nytt lösenord (minst {min} tecken)',
  'auth.passwordWithMin': 'Lösenord (minst {min} tecken)',

  // Säljpunkterna på landningssidan
  'landing.savesTime': 'Sparar tid',
  'landing.savesTimeDesc': 'AI skapar ditt schema på några sekunder',
  'landing.personal': '100 % personligt',
  'landing.personalDesc': 'Anpassat efter dina mål, förutsättningar och preferenser',
  'landing.research': 'Baserat på forskning',
  'landing.researchDesc': 'Vetenskapliga metoder för maximala resultat',
  'landing.secure': 'Säkert & tryggt',
  'landing.secureDesc': 'Din data är alltid skyddad',
  'landing.results': 'Byggt för resultat',
  'landing.resultsDesc': 'Fokus på långsiktiga resultat',

  // Onboarding — stegen
  'onb.step.goal': 'Ditt mål',
  'onb.step.level': 'Erfarenhet',
  'onb.step.equipment': 'Utrustning',
  'onb.step.schedule': 'Schema',
  'onb.step.diet': 'Kost',
  'onb.step.body': 'Om dig',

  // Målens underrubriker (etiketterna delas med goal.*)
  'onb.goal.lose_weight.desc': 'Fettförbränning & deficit',
  'onb.goal.build_muscle.desc': 'Styrka & hypertrofi',
  'onb.goal.maintain.desc': 'Balans & välmående',
  'onb.goal.improve_endurance.desc': 'Uthållighet & puls',

  // Nivåernas underrubriker (etiketterna delas med level.*)
  'onb.level.beginner.desc': '0–1 år träning',
  'onb.level.intermediate.desc': '1–3 år träning',
  'onb.level.advanced.desc': '3+ år träning',

  // Utrustning. VÄRDENA är svenska och lagras i profilen — bara etiketten översätts.
  'equip.gym': 'Gym (fullutrustat)',
  'equip.dumbbells': 'Hantlar',
  'equip.barbell': 'Skivstång',
  'equip.bands': 'Gummiband',
  'equip.pullupBar': 'Chin-up stång',
  'equip.kettlebells': 'Kettlebells',
  'equip.bodyweight': 'Inga redskap (kroppsvikt)',

  // Allergier. Samma sak: värdena lagras och skickas till AI:n.
  'allergy.gluten': 'Gluten',
  'allergy.lactose': 'Laktos',
  'allergy.nuts': 'Nötter',
  'allergy.eggs': 'Ägg',
  'allergy.fish': 'Fisk',
  'allergy.soy': 'Soja',
  'allergy.vegetarian': 'Vegetarian',
  'allergy.vegan': 'Vegan',

  // Onboarding — frågor och knappar
  'onb.q.goal': 'Vad är ditt mål?',
  'onb.q.goalSub': 'Vi anpassar schemat efter detta.',
  'onb.q.level': 'Träningserfarenhet?',
  'onb.q.levelSub': 'Välj den nivå som stämmer bäst.',
  'onb.q.equipment': 'Tillgänglig utrustning?',
  'onb.q.equipmentSub': 'Välj allt som stämmer.',
  'onb.q.days': 'Hur många dagar per vecka?',
  'onb.q.daysSub': 'Välj hur ofta du vill träna.',
  'onb.q.allergies': 'Allergier eller kostrestriktioner?',
  'onb.q.allergiesSub': 'Valfritt — hoppa över om inga.',
  'onb.back': 'Tillbaka',
  'onb.cancel': 'Avbryt',
  'onb.continue': 'Fortsätt',
  'onb.skip': 'Hoppa över',
  'onb.createPlan': 'Skapa mitt schema',
  'onb.stepOf': 'Steg {n} av {total}',
  'onb.skipAndCreate': 'Hoppa över och skapa schema',
  'onb.field.age': 'Ålder',
  'onb.field.weight': 'Vikt',
  'onb.field.height': 'Längd',
  'onb.calorieGoal': 'Kalorimål',
  'onb.caloriePlaceholder': 'Lämna tomt = auto',
  'onb.calorieHint': 'Tomt fält räknas ut automatiskt utifrån mål och kropp.',
  'onb.err.mockPlan': 'Kunde inte öppna testschema',
  'onb.err.needGoalLevel': 'Välj mål och träningsnivå innan du skapar schema.',
  'onb.err.needEquipment': 'Välj minst en utrustningstyp.',

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
