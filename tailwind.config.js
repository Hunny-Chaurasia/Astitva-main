/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#fbf2da', ink: '#321d35', rust: '#b63243', clay: '#d06b37',
        indigo: '#341849', marigold: '#e3ad36', olive: '#08796f', sand: '#efe1b9', muted: '#6c5b58',
      },
      fontFamily: { sans: ['DM Sans', 'sans-serif'], serif: ['Rozha One', 'Tiro Devanagari Hindi', 'serif'] },
      boxShadow: { soft: '0 12px 32px rgba(58, 43, 30, .06)' },
    },
  },
  plugins: [],
}
