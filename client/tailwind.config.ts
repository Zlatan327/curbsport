import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        asphalt: "#111311",
        surface: "#191c19",
        raised: "#252925",
        turf: "#00ff66",
        amber: "#ffd700",
        chalk: "#f0f0e8",
        smoke: "#8b908a",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-sans)", "Arial", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(0, 255, 102, .18)",
      },
    },
  },
  plugins: [],
};

export default config;
