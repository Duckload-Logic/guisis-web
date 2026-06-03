/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        warning: {
          background: "hsl(var(--warning-background))",
          foreground: "hsl(var(--warning-foreground))",
        },
        danger: {
          background: "hsl(var(--danger-background))",
          foreground: "hsl(var(--danger-foreground))",
        },
        success: {
          background: "hsl(var(--success-background))",
          foreground: "hsl(var(--success-foreground))",
        },
        info: {
          background: "hsl(var(--info-background))",
          foreground: "hsl(var(--info-foreground))",
        },
        stale: {
          background: "hsl(var(--stale-background))",
          foreground: "hsl(var(--stale-foreground))",
        },
        notice: {
          background: "hsl(var(--notice-background))",
          foreground: "hsl(var(--notice-foreground))",
        },
        glass: {
          bg: "var(--glass-bg)",
          border: "var(--glass-border)",
        },
      },
      backdropBlur: {
        glass: "var(--glass-blur)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-default)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        inner: "var(--shadow-inner)",
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
        "toast-slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        ring: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(20deg)" },
          "50%": { transform: "rotate(-20deg)" },
          "75%": { transform: "rotate(10deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "toast-slide-in-right":
          "toast-slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        ring: "ring 0.5s ease-in-out 3",
      },
    },
  },
  plugins: [],
};
