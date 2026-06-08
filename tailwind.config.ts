import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        mauve: "#2D1B2E",
        blush: "#F2D5D5",
        champagne: "#FAF7F5",
        lavender: "#C084FC",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
      },
      keyframes: {
        aurora: {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "33%": { transform: "translate(5%, -8%) scale(1.08)" },
          "66%": { transform: "translate(-4%, 6%) scale(0.94)" },
        },
        "aurora-slow": {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1.05)" },
          "50%": { transform: "translate(-6%, 10%) scale(0.96)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        aurora: "aurora 12s ease-in-out infinite",
        "aurora-slow": "aurora-slow 18s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out both",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
        "glow-border": "glow-border 2.5s ease-in-out infinite",
        "shimmer-sweep": "shimmer-sweep 0.55s ease-in-out",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
