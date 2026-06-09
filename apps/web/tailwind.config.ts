import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f0fdfb',
          100: '#ccfbf4',
          200: '#99f6e8',
          300: '#5eead6',
          400: '#2dd4bf',
          500: '#22e6c6',
          600: '#0fb8a0',
          700: '#0d9480',
          800: '#0f766a',
          900: '#115e56',
        },
        // Brand accent — teal matching logon (#22e6c6)
        brand: {
          50:  '#f0fdfb',
          100: '#ccfbf4',
          200: '#99f6e8',
          300: '#5eead6',
          400: '#2dd4bf',
          500: '#22e6c6',
          600: '#0fb8a0',
          700: '#0d9480',
          800: '#0f766a',
          900: '#115e56',
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
