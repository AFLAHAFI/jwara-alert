import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F6FAF7",
        primary: { DEFAULT: "#0F766E", dark: "#0B5D57" },
        alert: "#DC2626",
        ink: "#0F172A",
      },
      fontFamily: {
        sans: ["var(--font-malayalam)", "var(--font-devanagari)", "system-ui", "sans-serif"],
      },
      minHeight: { btn: "56px" },
    },
  },
  plugins: [],
};
export default config;
