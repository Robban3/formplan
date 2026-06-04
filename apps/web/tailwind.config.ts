import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
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
