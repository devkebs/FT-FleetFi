/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#2F8F4A',
        'brand-charcoal': '#1E1E1E',
        'brand-yellow': '#FFC857',
        'brand-gray': {
          'light': '#EFEFEF',
          'medium': '#A0A0A0',
          'dark': '#333333'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}