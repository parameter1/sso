const aspectRatio = require('@tailwindcss/aspect-ratio');
const defaultTheme = require('tailwindcss/defaultTheme');
const forms = require('@tailwindcss/forms');
const lineClamp = require('@tailwindcss/line-clamp');
const typography = require('@tailwindcss/typography');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [
    aspectRatio,
    forms,
    lineClamp,
    typography,
  ],
};
