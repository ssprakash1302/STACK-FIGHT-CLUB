/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0f0f0f',
        surface: '#1a1a1a',
        raised: '#222222',
        border: 'rgba(255,255,255,0.08)',
        primary: '#e8e6e0',
        secondary: '#888780',
        muted: '#555550',
      },
    },
  },
  plugins: [],
}
