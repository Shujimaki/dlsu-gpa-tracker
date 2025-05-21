/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dlsu-green': '#006f51',
        'dlsu-light-green': '#00a651',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 