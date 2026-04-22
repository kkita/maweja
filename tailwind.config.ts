import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/src/**/*.{ts,tsx}", "./client/index.html"],
  theme: {
    extend: {
      colors: {
        /* ── shadcn base ── */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* ── MAWEJA brand scale ── */
        brand: {
          DEFAULT: "#E10000",
          50:  "#fff1f1",
          100: "#ffe0e0",
          200: "#ffc7c7",
          300: "#ff9e9e",
          400: "#ff6464",
          500: "#E10000",
          600: "#c00000",
          700: "#a00000",
          800: "#830000",
          900: "#6c0000",
          950: "#3f0000",
        },
        /* ── Driver UI palette — adaptatif light/dark via CSS variables ──
         * Les tokens neutres (bg, surface, border, text…) référencent des
         * variables CSS définies dans index.css pour :root et .dark.
         * Les couleurs de marque (accent, green, amber…) restent constantes.
         * Usage: bg-driver-surface, text-driver-text, border-driver-border, etc.
         * Opacity modifier fonctionne sur les couleurs de marque: bg-driver-accent/10
         */
        driver: {
          bg:      "var(--driver-bg)",
          surface: "var(--driver-surface)",
          s2:      "var(--driver-s2)",
          s3:      "var(--driver-s3)",
          border:  "var(--driver-border)",
          border2: "var(--driver-border2)",
          muted:   "var(--driver-muted)",
          subtle:  "var(--driver-subtle)",
          text:    "var(--driver-text)",
          text2:   "var(--driver-text2)",
          text3:   "var(--driver-text3)",
          accent:  "#E10000",
          green:   "#22c55e",
          amber:   "#f59e0b",
          blue:    "#60a5fa",
          red:     "#ef4444",
          orange:  "#f97316",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        "ds-xs":    "0 1px 4px rgba(0,0,0,0.06)",
        "ds-sm":    "0 2px 8px rgba(0,0,0,0.08)",
        "ds-md":    "0 4px 16px rgba(0,0,0,0.10)",
        "ds-lg":    "0 8px 32px rgba(0,0,0,0.12)",
        "ds-brand": "0 4px 16px rgba(225,0,0,0.28)",
        /* bottom nav separator + ambient */
        "nav-bottom": "0 -1px 0 rgba(0,0,0,0.06), 0 -8px 32px rgba(0,0,0,0.06)",
        /* bottom sheet lift */
        "sheet":    "0 -8px 48px rgba(0,0,0,0.20)",
        /* driver glow effects */
        "glow-green":  "0 0 20px rgba(34,197,94,0.40)",
        "glow-accent": "0 4px 16px rgba(225,0,0,0.30)",
        "glow-green-sm": "0 4px 12px rgba(34,197,94,0.30)",
        "glow-amber-sm": "0 4px 12px rgba(245,158,11,0.30)",
      },
      transitionDuration: {
        "ds-fast":   "150",
        "ds-normal": "200",
        "ds-slow":   "300",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
