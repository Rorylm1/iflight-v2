import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme base colors
        background: "#0D0D0D",
        foreground: "#FAFAFA",
        // Amber accent (retro touch)
        amber: {
          DEFAULT: "#FFB000",
          50: "#FFF8E6",
          100: "#FFEFC2",
          200: "#FFE08A",
          300: "#FFD152",
          400: "#FFC21A",
          500: "#FFB000",
          600: "#CC8D00",
          700: "#996A00",
          800: "#664700",
          900: "#332300",
        },
        // Neutral grays for UI
        gray: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0D0D0D",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        // Subtle amber glow for cards
        "amber-glow": "0 0 20px rgba(255, 176, 0, 0.15)",
        "amber-glow-lg": "0 0 40px rgba(255, 176, 0, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
