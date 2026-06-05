import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f0f7f2',
          100: '#d9ece0',
          200: '#b3d9c2',
          300: '#7ebf98',
          400: '#4da372',
          500: '#2d8a57',
          600: '#1e6e42',
          700: '#185936',
          800: '#144a2d',
          900: '#0f3820',
        },
        // Brand accent used by the auth/onboarding/plan screens (emerald family,
        // matching the PWA theme color).
        brand: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} satisfies Config
