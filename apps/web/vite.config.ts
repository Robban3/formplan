import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// lucide-react@0.511 saknar "exports" — Vite 6 behöver explicit ESM-entry.
// createRequire hittar paketet oavsett om det ligger i root eller apps/web node_modules.
const lucidePkgDir = path.dirname(require.resolve('lucide-react/package.json'))
const lucideEntry = path.join(lucidePkgDir, 'dist/esm/lucide-react.js')

export default defineConfig({
  resolve: {
    alias: {
      'lucide-react': lucideEntry,
    },
  },
  optimizeDeps: {
    include: ['lucide-react'],
  },
  plugins: [react()],
  // vite-plugin-pwa avstängd: workbox generateSW kraschar i denna miljö.
  // Appen körs utan offline service worker tills PWA är återaktiverat.
})
