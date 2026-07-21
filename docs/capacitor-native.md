# Native-appar (Capacitor)

FormPlans webbapp (`apps/web`) wrappas som native iOS/Android-app med Capacitor.
Samma kodbas och webb-build körs i en WebView — inget skrivs om.

- **appId / bundle-id / package name:** `app.formplan.app`
- **appName:** `FormPlan`
- **webDir:** `dist` (Vites byggutdata)
- **Config:** `apps/web/capacitor.config.ts`

Native-lagret använder **CapacitorHttp** så API-anrop går förbi CORS (WebViewens
origin är `https://localhost` i native, vilket API:ts CORS annars blockerar).

## Viktigt: bygg alltid med produktions-API:t

Webb-builden bäddar in `VITE_API_URL`. För native MÅSTE den peka på prod, annars
pratar appen med `localhost`:

```
VITE_API_URL=https://api.formplan.app
```

Sätt även `VITE_SUPABASE_URL` och `VITE_SUPABASE_ANON_KEY` (samma som webben).

## Android — byggs på PC (Android Studio, ingen Mac)

```bash
cd apps/web
npm install
npm run cap:android      # bygger webben, synkar och öppnar Android Studio
```

I Android Studio: bygg/kör på emulator eller enhet. För release: **Build →
Generate Signed Bundle / APK → Android App Bundle (.aab)** och ladda upp i
Play Console.

Bara bygga utan att öppna Studio:
```bash
npm run cap:build:android
```

## iOS — byggs i molnet (Codemagic, ingen Mac krävs)

iOS-projektet genereras inte här (kräver CocoaPods/macOS). Det körs i Codemagics
macOS-runner:

1. Koppla repot i Codemagic.
2. Build-steg (macOS-runner):
   ```bash
   cd apps/web
   npm ci
   VITE_API_URL=https://api.formplan.app npm run build
   npx cap add ios          # första gången
   npx cap sync ios
   ```
3. Codemagic bygger, signerar (Apple Developer-konto) och laddar upp till
   App Store Connect / TestFlight.

## Kvar innan native-köp fungerar (RevenueCat)

In-app-köp läggs till senare: `@revenuecat/purchases-capacitor`, entitlement
`premium`, och en paywall-växel (webb = Stripe, app = RevenueCat) som skriver
till samma `subscriptions`-tabell. Kräver att butiks-apparna + produkterna finns
först.
