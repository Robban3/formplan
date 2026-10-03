# Universal Links / App Links

Inloggningslänkarna (magisk länk, lösenordsåterställning, Google) pekar på
`https://app.formplan.app/auth`. Samma länk ska öppna appen på telefonen och
webbversionen på en dator.

Innan detta fanns pekade länkarna på appens egna schema `app.formplan.app://`.
Det fungerade bara på telefonen: öppnade användaren återställningsmejlet på en
dator följde webbläsaren länken, Supabase brände engångstoken och försökte
skicka vidare till en adress datorn inte känner till. Resultatet blev en tom
sida **och** en förbrukad länk — nästa klick på telefonen sa "ogiltig länk".

Schemat finns kvar registrerat och fungerar fortfarande, som reserv.

## iOS — klart

| Del | Var |
|---|---|
| `apple-app-site-association` | `apps/web/public/.well-known/` |
| `Content-Type: application/json` | `apps/web/public/_headers` |
| `com.apple.developer.associated-domains` | skrivs i CI, se `codemagic.yaml` |

**Kvar att göra en gång, manuellt — i den här ordningen:**

1. Slå på **Associated Domains** på App ID:t i Apples portal (Certificates,
   Identifiers & Profiles → Identifiers → `app.formplan.app` → Capabilities).
   Kräver rollen **Admin** eller **Account Holder**; App Manager räcker inte.
2. Sätt `ENABLE_ASSOCIATED_DOMAINS=true` i Codemagics variabelgrupp
   `formplan_ios`.

Entitlementet är avstängt som standard just för att steg 1 kräver en roll som
inte alltid finns till hands. Skrivs entitlementet utan att capability:n är
påslagen utfärdar Apple ingen profil som tillåter det, och bygget faller på
signeringen — appen går då inte att bygga alls. Hellre en app utan Universal
Links än ingen app.

### Verifiera

```
curl -sI https://app.formplan.app/.well-known/apple-app-site-association
```

Ska ge `200` och `content-type: application/json`. Allt annat — särskilt
`text/html`, vilket betyder att SPA-omskrivningen svalde filen — gör att iOS
inte kopplar domänen.

iOS hämtar filen när appen installeras och cachar resultatet. Ändras den måste
appen installeras om för att ändringen ska slå igenom.

## Android — inte klart

Kräver `apps/web/public/.well-known/assetlinks.json` med SHA-256-fingeravtrycket
för det certifikat appen distribueras med.

**Det ska vara Google Plays app-signeringscertifikat, inte din uppladdningsnyckel.**
Play signerar om appen innan distribution, så fingeravtrycket från
`formplan-upload.jks` är fel och gör att verifieringen misslyckas tyst — länkarna
öppnas i webbläsaren i stället för i appen.

Fingeravtrycket finns först efter första uppladdningen till Play:

**Play Console → Release → Setup → App integrity → App signing key certificate →
SHA-256 certificate fingerprint**

Skapa sedan filen:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "app.formplan.app",
    "sha256_cert_fingerprints": ["<SHA-256 från Play Console>"]
  }
}]
```

och lägg till i `AndroidManifest.xml`, bredvid det befintliga
schema-intent-filtret:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="app.formplan.app" android:pathPrefix="/auth" />
</intent-filter>
```

Verifiera med `adb shell pm get-app-links app.formplan.app` — ska visa
`verified` för domänen.

## Supabase

`https://app.formplan.app/auth` måste ligga i **Authentication → URL
Configuration → Redirect URLs**, annars faller GoTrue tillbaka på Site URL.
Lämna kvar `app.formplan.app://auth` där också, så länge schemat används som
reserv.
