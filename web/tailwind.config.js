/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          normal: 'var(--accent)',
          dark: 'var(--accent-dark)',
          light: 'var(--accent-light)'
        },
        light: {
          normal: 'var(--background)'
        }
      }
    },

  },
  plugins: [],
}

