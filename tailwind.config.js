const colors = require ('tailwindcss/colors')

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          1: "var(--color-accent1)",
          2: "var(--color-accent2)",
        },
        var: {
          red: "var(--color-red-accent)",
          green: "var(--color-green-accent)",
          blue: "var(--color-blue-accent)",
          softblue: "var(--color-softblue-accent)",
        },
        bkg: {
          base: "var(--color-bkg-base)",
          primary: "var(--color-bkg-primary)",
          secondary: "var(--color-bkg-secondary)",
          tertiary: "var(--color-bkg-tertiary)",
        },
        label: {
          primary: "var(--color-label-primary)",
          secondary: "var(--color-label-secondary)",
          tertiary: "var(--color-label-tertiary)",
        },
      }
    },
  },
  plugins: [],
}