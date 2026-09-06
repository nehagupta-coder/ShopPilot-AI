/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        serif: ["Newsreader", "Georgia", "serif"],
      },
      colors: {
        ink: {
          50: "#F7F4EF",
          100: "#EDE7DC",
          200: "#D9D0C1",
          300: "#B8AD9A",
          400: "#8C8273",
          500: "#6B6358",
          600: "#4A453D",
          700: "#322E28",
          800: "#221F1B",
          900: "#161411",
          950: "#0E0C0A",
        },
        copper: {
          50: "#FBF4EE",
          100: "#F5E4D4",
          200: "#E8C4A4",
          300: "#D9A06E",
          400: "#C97B42",
          500: "#B86228",
          600: "#9A4E1F",
          700: "#7A3D1B",
          800: "#64331C",
          900: "#542C1B",
        },
        forest: {
          50: "#F0F6F2",
          100: "#DCEBE2",
          400: "#4A8A68",
          500: "#2F6B4F",
          600: "#245540",
          700: "#1C4232",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,20,17,0.04), 0 8px 24px rgba(22,20,17,0.06)",
        lift: "0 12px 40px rgba(22,20,17,0.10)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 80%, 100%": { opacity: "0.3", transform: "scale(0.85)" },
          "40%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.45s ease-out both",
        pulseDot: "pulseDot 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
