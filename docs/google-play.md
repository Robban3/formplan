# Google Play — från repo till internt test

Android-appen byggs av workflowen `android-formplan` i `codemagic.yaml`.
Förkraven i Codemagic-UI:t står i kommentarerna där; den här filen tar
resten — det som bara går att göra i Play Console, och i vilken ordning.

Motsvarigheten för iOS är `docs/capacitor-native.md`.

## 1. Signeringsnyckeln (en gång, och viktigast av allt)

Ladda upp `formplan-upload.jks` i Codemagic under **Code signing → Android
keystore** med referensnamnet `formplan_upload` — samma namn som
`android_signing` i `codemagic.yaml`.

Har du ingen nyckel ännu står `keytool`-kommandot i
`apps/web/android/app/build.gradle`.

**Lägg undan nyckeln och lösenorden på två säkra ställen.** Tappar du
keystoren kan appen aldrig uppdateras igen — Play identifierar appen med
den, och det finns ingen återställning utom en manuell begäran hos Google
som kan nekas. Den som får tag på den kan publicera uppdateringar i ditt
namn.

Bygget avbryts med ett tydligt fel om nyckeln saknas, i stället för att
producera en osignerad `.aab` som Play avvisar långt senare.

## 2. Miljövariabler i Codemagic

Grupp **`formplan_android`** med samma tre värden som `formplan_ios`:

```
VITE_API_URL           = https://api.formplan.app
VITE_SUPABASE_URL      = https://rgnbcmgvzohqkmnuixps.supabase.co
VITE_SUPABASE_ANON_KEY = <anon-nyckeln>
```

De används av webb-bygget, inte av Android — men utan dem pekar appen på
fel API.

## 3. Bygg och hämta paketet

Kör **FormPlan Android**. Hämta `.aab`:n under byggets *Artifacts*.

`versionCode` kommer från Codemagics räknare. Play avvisar en uppladdning
vars `versionCode` redan använts, så varje bygge måste ha ett nytt — det
sköter sig självt, men om du någon gång laddat upp ett högre nummer
manuellt måste räknaren förbi det.

## 4. Play Console: skapa appen

Kräver ett Google Play-utvecklarkonto (engångsavgift 25 USD).

**Skapa app** → namn `FormPlan`, standardspråk svenska, typ *App*,
*Gratis*.

Paketnamnet är `app.formplan.app` och **kan inte ändras efteråt** — det är
appens identitet i Play för alltid.

## 5. App content — det som blockerar utrullningen

Google släpper inte igenom en release, inte ens till internt test, förrän
deklarationerna under **Policy → App content** är ifyllda. Det här är
nästan alltid det som tar tid, så gör det före eller parallellt med
uppladdningen:

| Deklaration | Vad som gäller för FormPlan |
|---|---|
| Integritetspolicy | `https://app.formplan.app/integritet` — redan publik, ingen inloggning krävs |
| App access | Appen kräver konto. Lämna testinloggningen här, annars kan granskaren inte komma in |
| Ads | Nej, appen har inga annonser |
| Content rating | Enkät. En tränings- och kostapp landar normalt i lägsta åldersgruppen |
| Target audience | Inte barn. Kontot kräver 13 år (se `age`-valideringen i API:t) |
| Data safety | Störst arbetet. Deklarera e-post, hälso- och träningsdata, vikt och mått — och att det lagras krypterat och kan raderas i appen |
| Health apps | Gäller en app som hanterar hälsodata. Deklarera träning och kost; appen använder INTE Health Connect |
| Financial features | Nej |
| Government apps | Nej |

Data safety ska stämma med det policyn faktiskt säger. Avviker de från
varandra är det en policyöverträdelse, inte ett formfel.

## 6. Internt test

**Testning → Internt test → Skapa ny release** och ladda upp `.aab`:n.

Lägg till testarna som en e-postlista under fliken *Testare*, och skicka
dem **opt-in-länken** som visas där. De måste öppna den och acceptera
innan appen syns i deras Play Store — annars får de "appen är inte
tillgänglig", vilket ser ut som ett fel men är opt-in som saknas.

Internt test har ingen granskning och ingen väntetid.

## 7. Efter första uppladdningen

### Android App Links

`apps/web/public/.well-known/assetlinks.json` finns inte ännu, så
`https://app.formplan.app/...`-länkar öppnas i webbläsaren i stället för i
appen.

**Det blockerar inte testning:** inloggningslänkarna går via schemat
`app.formplan.app://`, som `AndroidManifest.xml` redan hanterar och som
ligger i Supabase under *Authentication → URL Configuration*.

För att fixa det behövs Plays SHA-256, som bara finns efter att ett paket
laddats upp: **Play Console → Test and release → App integrity → App
signing key certificate → SHA-256**. Lägg den i `assetlinks.json` enligt
`docs/universal-links.md`.

### Automatisk publicering

`publishing:`-blocket i `codemagic.yaml` ligger avstängt med flit. Googles
Publishing API vägrar ta emot det **första** paketet för ett nytt app-id,
så ett automatiskt bygge hade failat i sista steget trots att allt annat
gått bra. Slå på det efter den manuella uppladdningen; det som behövs står
i kommentaren där.

## Värt att veta innan du planerar lanseringen

Registrerade du Play-kontot som **privatperson efter 13 november 2023**
kräver Google ett **stängt** test med minst **12 testare som varit
opt-in i 14 dygn i sträck** innan du får ansöka om produktionsåtkomst.
Internt test räknas inte. Organisationskonton är undantagna.

Det är en tvåveckorsklocka som inte kan kortas, så starta det stängda
testet tidigt även om appen inte är klar — den går att uppdatera under
tiden.
