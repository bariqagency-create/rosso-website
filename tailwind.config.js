/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx,mdx}',
    './components/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rosso: {
          DEFAULT: '#E10600',
          50:  '#FFE5E5',
          100: '#FFB8B8',
          200: '#FF8585',
          300: '#FF5252',
          400: '#FF1A0F',
          500: '#E10600',
          600: '#B30500',
          700: '#850300',
          800: '#570200',
          900: '#2A0100',
        },
        ink: {
          DEFAULT: '#0A0A0A',
          50: '#1A1A1A',
          100: '#141414',
          200: '#0F0F0F',
          300: '#0A0A0A',
          400: '#080808',
          500: '#050505',
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', 'sans-serif'],
        body: ['Archivo', 'sans-serif'],
        mono: ['Audiowide', 'sans-serif'],
        ar: ['Tajawal', 'sans-serif'],
        'ar-display': ['Cairo', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.25em',
        ultra: '0.4em',
      },
      animation: {
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.6s ease-out both',
        'pulse-red': 'pulse-red 2s infinite',
        'ticker': 'ticker 40s linear infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(225,6,0,0.7)' },
          '50%': { boxShadow: '0 0 0 14px rgba(225,6,0,0)' },
        },
        ticker: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      boxShadow: {
        'red-glow': '0 0 30px -8px rgba(225,6,0,0.5), inset 0 0 0 1px rgba(225,6,0,0.3)',
        'red-pulse': '0 10px 40px -10px rgba(225,6,0,0.6)',
      },
      backgroundImage: {
        'grid-faint': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
