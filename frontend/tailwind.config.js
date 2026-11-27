/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'], display: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      boxShadow: { glow: '0 20px 80px -40px rgba(239, 68, 68, 0.45)' },
    },
  },
  plugins: [],
}
