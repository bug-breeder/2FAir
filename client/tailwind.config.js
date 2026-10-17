import { heroui } from "@heroui/theme";

// Bambotics palette (https://bambotics.dev): ink + paper, lime and yellow
// bamboo, leaf green.
const ink = "#1b2316";
const lime = "#ccff90";
const yellow = "#fff380";

const green = {
  50: "#f5fde9",
  100: "#e8fbcf",
  200: lime,
  300: "#b4f46a",
  400: "#9bef45",
  500: "#6cc02f",
  600: "#428824",
  700: "#2e6a1f",
  800: "#25401b",
  900: ink,
};

const amber = {
  50: "#fffde8",
  100: "#fffac4",
  200: yellow,
  300: "#ffe94d",
  400: "#f5d522",
  500: "#dcb400",
  600: "#ac8200",
  700: "#7f6000",
  800: "#593c00",
  900: "#3a2800",
};

const red = {
  50: "#fef3f1",
  100: "#fde4e0",
  200: "#fbc9c2",
  300: "#f6a195",
  400: "#ee6c5c",
  500: "#e04432",
  600: "#c4321f",
  700: "#a2281a",
  800: "#85241a",
  900: "#6e231b",
};

const reverse = (scale) => {
  const keys = Object.keys(scale);
  const values = Object.values(scale).reverse();

  return Object.fromEntries(keys.map((k, i) => [k, values[i]]));
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // One step up from Tailwind's defaults for body text: 17px body as on
      // iOS, with extra leading for stacked Vietnamese diacritics. Headings
      // (xl and up) keep the defaults.
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.25rem" }],
        sm: ["0.9375rem", { lineHeight: "1.375rem" }],
        base: ["1.0625rem", { lineHeight: "1.625rem" }],
        lg: ["1.1875rem", { lineHeight: "1.75rem" }],
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        code: ["var(--font-code)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        lime,
        yellow,
        leaf: "#9bef45",
        ink,
      },
      screens: {
        betterhover: { raw: "(hover: hover)" },
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      // Rounder corners and hairline-ring shadows, like the site's cards.
      layout: {
        radius: { small: "10px", medium: "14px", large: "24px" },
        // Same steps as fontSize above, for HeroUI's text-tiny..text-large.
        fontSize: {
          tiny: "0.8125rem",
          small: "0.9375rem",
          medium: "1.0625rem",
          large: "1.1875rem",
        },
        lineHeight: {
          tiny: "1.25rem",
          small: "1.375rem",
          medium: "1.625rem",
          large: "1.75rem",
        },
      },
      themes: {
        light: {
          layout: {
            boxShadow: {
              small: "0 0 0 1px #e1e6da, 0 2px 8px rgb(119 119 119 / 0.08)",
              medium: "0 0 0 1px #e1e6da, 0 8px 28px rgb(119 119 119 / 0.14)",
              large: "0 0 0 1px #e1e6da, 0 16px 40px rgb(119 119 119 / 0.2)",
            },
          },
          colors: {
            background: "#ffffff",
            foreground: ink,
            divider: "#e1e6da",
            focus: green[600],
            content1: { DEFAULT: "#ffffff", foreground: ink },
            content2: { DEFAULT: "#f4f7ef", foreground: ink },
            content3: { DEFAULT: "#e1e6da", foreground: ink },
            content4: { DEFAULT: "#c9d1bf", foreground: ink },
            default: {
              50: "#f7f9f4",
              100: "#f0f3eb",
              200: "#e1e6da",
              300: "#c9d1bf",
              400: "#a3ad97",
              // 4.5:1 on white and on default-100.
              500: "#66705d",
              600: "#5a6451",
              700: "#434b3c",
              800: "#2d3328",
              900: ink,
              DEFAULT: "#e1e6da",
              foreground: ink,
            },
            // Ink buttons on paper, like the site's light mode.
            primary: { ...green, DEFAULT: ink, foreground: "#ffffff" },
            secondary: { ...green, DEFAULT: lime, foreground: ink },
            success: { ...green, DEFAULT: green[700], foreground: "#ffffff" },
            warning: { ...amber, DEFAULT: amber[600], foreground: "#ffffff" },
            danger: { ...red, DEFAULT: red[600], foreground: "#ffffff" },
          },
        },
        dark: {
          layout: {
            boxShadow: {
              small: "0 0 0 1px #292c2a, 0 2px 8px rgb(0 0 0 / 0.3)",
              medium: "0 0 0 1px #292c2a, 0 12px 32px rgb(0 0 0 / 0.3)",
              large: "0 0 0 1px #333533, 0 16px 40px rgb(0 0 0 / 0.45)",
            },
          },
          colors: {
            background: "#111312",
            foreground: "#f5f7f5",
            divider: "#292c2a",
            focus: lime,
            content1: { DEFAULT: "#1a1c1b", foreground: "#f5f7f5" },
            content2: { DEFAULT: "#242725", foreground: "#f5f7f5" },
            content3: { DEFAULT: "#2e312f", foreground: "#f5f7f5" },
            content4: { DEFAULT: "#3d413e", foreground: "#f5f7f5" },
            default: {
              50: "#1a1c1b",
              100: "#242725",
              200: "#2e312f",
              300: "#3d413e",
              400: "#606562",
              // 4.5:1 on content1 and content2.
              500: "#8b908c",
              600: "#9a9f9b",
              700: "#b1b6b1",
              800: "#d5d9d5",
              900: "#f5f7f5",
              DEFAULT: "#3d413e",
              foreground: "#f5f7f5",
            },
            // Lime buttons on ink, like the site's dark mode.
            primary: { ...reverse(green), DEFAULT: lime, foreground: ink },
            secondary: { ...reverse(green), DEFAULT: lime, foreground: ink },
            success: {
              ...reverse(green),
              DEFAULT: green[400],
              foreground: ink,
            },
            warning: { ...reverse(amber), DEFAULT: yellow, foreground: ink },
            danger: { ...reverse(red), DEFAULT: red[400], foreground: ink },
          },
        },
      },
    }),
  ],
};
