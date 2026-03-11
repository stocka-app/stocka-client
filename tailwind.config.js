/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── shadcn/ui bridge (maps to our CSS-var bridge in globals.css) ──
        background:  "var(--background)",
        foreground:  "var(--foreground)",
        border:      "var(--border)",
        input:       "var(--input)",
        ring:        "var(--ring)",
        primary: {
          DEFAULT:    "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        card: {
          DEFAULT:    "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT:    "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        muted: {
          DEFAULT:    "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT:    "var(--muted)",
          foreground: "var(--foreground)",
        },
        destructive: {
          DEFAULT:    "var(--destructive)",
          foreground: "#ffffff",
        },

        // ── Stocka brand tokens ────────────────────────────────────────────
        brand: {
          DEFAULT: "var(--color-brand-primary)",
          hover:   "var(--color-brand-primary-hover)",
          light:   "var(--color-brand-primary-light)",
        },

        // ── Surface hierarchy ──────────────────────────────────────────────
        surface: {
          page:    "var(--color-surface-page)",
          card:    "var(--color-surface-card)",
          sidebar: "var(--color-surface-sidebar)",
          header:  "var(--color-surface-header)",
          raised:  "var(--color-surface-raised)",
          overlay: "var(--color-surface-overlay)",
        },

        // ── Neutral scale ──────────────────────────────────────────────────
        neutral: {
          0:   "var(--color-neutral-0)",
          50:  "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
        },

        // ── Semantic ───────────────────────────────────────────────────────
        success: {
          DEFAULT: "var(--color-success)",
          bg:      "var(--color-success-bg)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          bg:      "var(--color-warning-bg)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          bg:      "var(--color-danger-bg)",
        },
        info: {
          DEFAULT: "var(--color-info)",
          bg:      "var(--color-info-bg)",
        },

        // ── Third-party brand colors ───────────────────────────────────────
        facebook: "#1877F2",

        // ── Auth-specific tokens ───────────────────────────────────────────
        auth: {
          body:        "var(--color-auth-body)",
          "left-panel": "var(--color-auth-left-panel)",
          surface:     "var(--color-auth-surface)",
          border:      "var(--color-auth-border)",
          highlight:   "var(--color-auth-highlight)",
          btn:         "var(--color-auth-btn)",
          "btn-hover": "var(--color-auth-btn-hover)",
          action:      "var(--color-auth-action)",
          "action-hover": "var(--color-auth-action-hover)",
          "right-panel": "var(--color-auth-right-panel, var(--color-auth-surface))",
          "input-bg":  "var(--color-auth-input-bg, transparent)",
          "input-border": "var(--color-auth-input-border, var(--color-auth-border))",
        },
      },

      fontFamily: {
        app:  ["var(--font-app)", "sans-serif"],
        auth: ["var(--font-auth)", "sans-serif"],
        sans: ["var(--font-app)", "sans-serif"],
      },

      borderRadius: {
        sm:   "var(--radius-sm)",
        md:   "var(--radius-md)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },

      boxShadow: {
        card:         "var(--shadow-card)",
        dropdown:     "var(--shadow-dropdown)",
        "glow-brand":   "var(--glow-brand)",
        "glow-success": "var(--glow-success)",
        "glow-danger":  "var(--glow-danger)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shake": "shake 0.5s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

