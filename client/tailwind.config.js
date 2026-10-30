/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: { 50: "#ecfdf3", 100: "#d1fadf", 200: "#a6f4c5", 300: "#6ce9a6", 400: "#32d583", 500: "#12b76a", 600: "#039855", 700: "#027a48", 800: "#05603a", 900: "#054f31", 950: "#053321" },
        ink: { 50: "#f9fafb", 100: "#f2f4f7", 200: "#e4e7ec", 300: "#d0d5dd", 400: "#98a2b3", 500: "#667085", 600: "#475467", 700: "#344054", 800: "#1d2939", 900: "#101828", 950: "#0b1220" },
      },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
      keyframes: {
        "fade-up": { "0%": { opacity: 0, transform: "translateY(16px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        "fade-in": { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
      },
      animation: { "fade-up": "fade-up .6s ease-out both", "fade-in": "fade-in .4s ease-out both", float: "float 5s ease-in-out infinite" },
    },
  },
  plugins: [],
};
