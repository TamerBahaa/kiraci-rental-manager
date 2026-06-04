/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      colors: {
        brand: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fbd6ac',
          300: '#f7b677',
          400: '#f3893f',
          500: '#ef651a',
          600: '#e04d10',
          700: '#b93a10',
          800: '#932f14',
          900: '#772914',
          950: '#401208',
        },
        slate: {
          850: '#1a2235',
          950: '#0f172a',
        }
      },
    },
  },
  plugins: [],
}
