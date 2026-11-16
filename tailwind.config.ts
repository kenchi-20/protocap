import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: "#7A1C1C",
          deep: "#5C1212",
          soft: "#F6E8E6",
          mid: "#A33A3A",
        },
        gold: {
          DEFAULT: "#D97706",
          deep: "#B45309",
          soft: "#FEF3C7",
        },
        ink: "#0F172A",
        paper: "#F8FAFC",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(122, 28, 28, 0.06)",
        float: "0 12px 40px rgba(15, 23, 42, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
