import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.formplan.app',
  appName: 'FormPlan',
  webDir: 'dist',
  plugins: {
    // Native HTTP-lager: API-anrop görs av native-lagret i stället för
    // WebViewen, så de slipper CORS (WebViewens origin är https://localhost
    // i native, vilket API:ts CORS-allowlist annars skulle blockera).
    // Gäller bara native-builds — på webben används vanlig fetch.
    CapacitorHttp: { enabled: true },
  },
}

export default config
