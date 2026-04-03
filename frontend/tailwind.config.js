/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        canvas: '#070708',
        surface: '#0e0e11',
        raised: '#14141a',
        depth: '#1a1a22',
        border: 'rgba(255,255,255,0.07)',
        primary: '#f4f1ea',
        secondary: '#a39e92',
        muted: '#6b6560',
        gold: {
          DEFAULT: '#d4af37',
          dim: '#9a7b2c',
          glow: '#f0d875',
          mid: '#c9a227',
        },
        blood: '#8b2942',
        arena: '#0c0c10',
      },
      boxShadow: {
        glow: '0 0 24px rgba(212, 175, 55, 0.15)',
        'glow-sm': '0 0 12px rgba(212, 175, 55, 0.12)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      backgroundImage: {
        'noise':
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.45s ease-out forwards',
        shimmer: 'shimmer 2s ease-in-out infinite',
        'scan-line': 'scan-line 3.5s linear infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        float: 'float 4s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.65' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(212, 175, 55, 0.35)' },
          '70%': { boxShadow: '0 0 0 10px rgba(212, 175, 55, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(212, 175, 55, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
}
