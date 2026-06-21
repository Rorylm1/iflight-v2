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
        // ── "Manila Boarding Pass" palette ──────────────────────────
        // The page is warm ticket-counter manila; passes sit on it as
        // lighter ticket stock. Accents carry meaning: teal = your
        // action / live, brick-red = long-haul / alert.
        paper: { DEFAULT: "#D8D3C7", deep: "#CFC9BB" }, // page surface
        pass: "#F3EFE6", // boarding-pass stock
        stub: "#E9E3D6", // the tear-off stub
        ink: { DEFAULT: "#1D1B16", soft: "#6A6557", faint: "#8C8675" },
        line: "#CDC6B6", // hairlines / perforations
        teal: { DEFAULT: "#0E5A57", soft: "#15807A" }, // primary accent
        brick: "#C8102E", // long-haul / alert accent

        // ── Legacy dark tokens (kept for the /map route which stays
        //    dark over the Mapbox globe) ──────────────────────────────
        background: "#0D0D0D",
        foreground: "#FAFAFA",
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
        // Bricolage Grotesque — the big IATA codes & wordmark (display)
        display: ["var(--font-display)", "Georgia", "serif"],
        // Sora — body / UI text
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        // Martian Mono — printed ticket data (boxy, dot-matrix feel)
        ticket: ["var(--font-ticket)", "ui-monospace", "monospace"],
        // JetBrains Mono — retained for the map/stats route
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        // soft printed-card lift for boarding passes
        pass: "0 18px 40px -18px rgba(60,55,40,0.28), 0 2px 0 rgba(0,0,0,0.03)",
        "pass-hover":
          "0 28px 56px -22px rgba(60,55,40,0.32), 0 3px 0 rgba(0,0,0,0.04)",
        // legacy amber glow (map route)
        "amber-glow": "0 0 20px rgba(255, 176, 0, 0.15)",
        "amber-glow-lg": "0 0 40px rgba(255, 176, 0, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
