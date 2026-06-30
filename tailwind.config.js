/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#f7f4ee',
        ink: '#1f2421',
        moss: '#3f6b52',
        moss2: '#4f8a68',
        clay: '#c8775a',
        sand: '#e8e1d4',
        warn: '#d98841',
        danger: '#c4554d',
        ok: '#4f8a68',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
