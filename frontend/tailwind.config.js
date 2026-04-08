/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fdf3ec",
          100: "#fae2d0",
          200: "#f5c4a1",
          300: "#eda47a",
          400: "#e2835c",
          500: "#d4703e",
          600: "#c4622d",
          700: "#a34f22",
          800: "#7e3c18",
          900: "#5a2a0f",
        },
        // Warm scale uses CSS variables so the entire palette flips in dark mode
        // without touching individual components. Values are RGB channels
        // so Tailwind's opacity modifiers (e.g. bg-warm-200/50) still work.
        warm: {
          50:  "rgb(var(--warm-50)  / <alpha-value>)",
          100: "rgb(var(--warm-100) / <alpha-value>)",
          200: "rgb(var(--warm-200) / <alpha-value>)",
          300: "rgb(var(--warm-300) / <alpha-value>)",
          400: "rgb(var(--warm-400) / <alpha-value>)",
          500: "rgb(var(--warm-500) / <alpha-value>)",
          600: "rgb(var(--warm-600) / <alpha-value>)",
          700: "rgb(var(--warm-700) / <alpha-value>)",
          800: "rgb(var(--warm-800) / <alpha-value>)",
          900: "rgb(var(--warm-900) / <alpha-value>)",
        },
        sage: {
          50:  "#f3f7f0",
          100: "#e2eedd",
          200: "#c4dcba",
          300: "#a3c793",
          400: "#8a9e7b",
          500: "#718c62",
          600: "#5a7249",
        },
        gold: {
          50:  "#fdf8ec",
          100: "#f9edca",
          200: "#f3d98a",
          300: "#e9c05c",
          400: "#c9a84c",
          500: "#a88a39",
          600: "#866d2c",
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"DM Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up":   "fade-up 0.4s ease-out both",
        "fade-in":   "fade-in 0.3s ease-out both",
        "slide-up":  "slide-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};
