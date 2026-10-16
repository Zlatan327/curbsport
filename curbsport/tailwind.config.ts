import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        asphalt: "#111311",
        turf: "#00FF66",
        caution: "#FFD700",
        chalk: "#F0F0E8",
        smoke: "#8B908A",
      },
      fontFamily: {
        display: ["var(--font-display)", "Arial Black", "sans-serif"],
        body: ["var(--font-body)", "Arial", "sans-serif"],
      },
      boxShadow: {
        hard: "4px 4px 0 #000",
        "hard-green": "4px 4px 0 #00FF66",
      },
    },
  },
  plugins: [],
};

export default config;
