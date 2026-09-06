/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#0F172A",
        "ink-muted": "#64748B",
        "ink-faint": "#94A3B8",
        border: "#E2E8F0",
        surface: "#FFFFFF",
        canvas: "#F6F7FB",
        accent: "#4F46E5",
        "accent-soft": "#EEF2FF",
        "accent-ink": "#4338CA",
        good: "#16A34A",
        "good-soft": "#F0FDF4",
        bad: "#DC2626",
        "bad-soft": "#FEF2F2",
        warn: "#D97706",
        "warn-soft": "#FFFBEB",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 8px rgba(15,23,42,0.04)",
      },
    },
  },
  plugins: [],
};
