/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Disable dark mode
  darkMode: false,
  theme: {
    extend: {
      colors: {
        'dlsu-green': '#006f51',
        'dlsu-light-green': '#00a651',
      },
      backgroundColor: {
        // Ensure light backgrounds for form elements
        'input': '#ffffff',
        'button': '#ffffff',
        'select': '#ffffff',
      },
      textColor: {
        // Ensure dark text for form elements
        'input': '#111827',
        'button': '#111827',
        'select': '#111827',
      },
    },
  },
  plugins: [],
} 