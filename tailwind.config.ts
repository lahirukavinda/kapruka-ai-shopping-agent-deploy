import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: "#fef3e2",
          100: "#fde4b9",
          200: "#fcd48c",
          300: "#fbc45f",
          400: "#fab83d",
          500: "#f9ac1b",
          600: "#f59d18",
          700: "#ef8a14",
          800: "#e97810",
          900: "#df5808",
        },
        kapri: {
          orange: "#f9ac1b",
          deep: "#df5808",
          warm: "#fef3e2",
          dark: "#1a1a2e",
          darker: "#16213e",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Sinhala", "system-ui", "sans-serif"],
        sinhala: ["Noto Sans Sinhala", "system-ui", "sans-serif"],
      },
      animation: {
        shimmer: "shimmer 1.5s ease-in-out infinite",
        "bounce-in": "bounceIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        breathing: "breathing 3s ease-in-out infinite",
        "dot-bounce": "dotBounce 1.4s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        bounceIn: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        slideUp: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        breathing: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        dotBounce: {
          "0%, 80%, 100%": { transform: "translateY(0)" },
          "40%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
