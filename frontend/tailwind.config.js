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
        warm: {
          50:  "#f7f4ef",
          100: "#f0ebe2",
          200: "#e8e4db",
          300: "#d8d3c8",
          400: "#bfb9ac",
          500: "#9e9888",
          600: "#6b6b5e",
          700: "#4a4a3e",
          800: "#2e2e25",
          900: "#1a1a18",
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
