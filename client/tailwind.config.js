/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B2430",
        accent: "#2B5CE7",
        good: "#1F9D6C",
        bad: "#D6432E",
        warn: "#C68A15",
      },
    },
  },
  plugins: [],
};
