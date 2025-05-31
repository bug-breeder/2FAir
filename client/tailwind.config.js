import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      screens: {
        betterhover: { raw: "(hover: hover)" },
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      // themes: {
      // light: {
      //   colors: {
      //     primary: "#FF71D7",
      //   },
      // },
      // dark: {
      //   colors: {
      //     primary: "#CC3EA4",
      //   },
      // },
      // },
    }),
  ],
};
