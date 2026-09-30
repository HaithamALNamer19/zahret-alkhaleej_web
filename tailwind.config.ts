import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: "#f0f5ff",
          100: "#e0ebfe",
          200: "#bad2fd",
          300: "#7fb1fb",
          400: "#3d88f6",
          500: "#1d62ca",
          600: "#0e3a82",
          700: "#0b2e6b",
          800: "#08204d",
          900: "#061838",
          950: "#030c1d",
        },
        brand: {
          navy: "#0e3a82",
          navyDark: "#08204d",
          navyLight: "#1d62ca",
          red: "#dc2626",
          redDark: "#991b1b",
          redLight: "#fee2e2",
        },
        sea: {
          50: "#f2fbfb",
          100: "#dff6f6",
          500: "#0d9488",
          600: "#0f766e",
          700: "#115e59",
          800: "#134e4a",
        },
        status: {
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#3b82f6",
        }
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
