/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'glass': {
          'white': 'rgba(255, 255, 255, 0.1)',
          'white-strong': 'rgba(255, 255, 255, 0.2)',
          'white-subtle': 'rgba(255, 255, 255, 0.05)',
          'dark': 'rgba(0, 0, 0, 0.1)',
          'border': 'rgba(255, 255, 255, 0.18)',
          'border-accent': 'rgba(255, 255, 255, 0.3)',
          'border-subtle': 'rgba(255, 255, 255, 0.08)',
        },
        'accent': {
          'primary': '#6366f1',
          'secondary': '#ec4899',
          'success': '#10b981',
          'warning': '#f59e0b',
          'error': '#ef4444',
        }
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'aurora-shift': 'aurora-shift 15s ease infinite',
        'cosmic-flow': 'cosmic-flow 20s ease infinite',
        'ocean-wave': 'ocean-wave 18s ease infinite',
        'glass-shimmer': 'glass-shimmer 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}