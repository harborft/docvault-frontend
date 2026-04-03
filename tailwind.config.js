/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        navy: '#0D1B2A',
        gold: '#C9A84C',
        'gold-light': '#E8C96A',
        muted: '#4A6070',
        border: '#E4E8EE',
        surface: '#F2F4F7',
      },
    },
  },
  plugins: [],
};
