/// <reference types="vitest" />
import { readFileSync } from "node:fs";

import { defineConfig, mergeConfig } from "vite";
import { defineConfig as defineTestConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

const { version } = JSON.parse(readFileSync("./package.json", "utf8"));

// https://vitejs.dev/config/
export default mergeConfig(
  defineConfig({
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    plugins: [
      react(),
      tsconfigPaths(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "favicon.svg", "apple-touch-icon.png"],
        manifest: {
          name: "2FAir Authenticator",
          short_name: "2FAir",
          description:
            "Offline, end-to-end encrypted 2FA codes. No account, no server.",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
          start_url: "/",
          scope: "/",
          icons: [
            { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
            { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
            {
              src: "maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
          navigateFallback: "/index.html",
          runtimeCaching: [
            {
              // Service logos; the app falls back to initials when offline.
              urlPattern:
                /^https:\/\/cdn\.jsdelivr\.net\/gh\/bug-breeder\/aegis-icons/,
              handler: "CacheFirst",
              options: {
                cacheName: "service-icons",
                expiration: {
                  maxEntries: 300,
                  maxAgeSeconds: 60 * 60 * 24 * 90,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            ui: ["@heroui/react"],
          },
        },
      },
    },
  }),
  defineTestConfig({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: true,
      reporters: ["verbose"],
      coverage: {
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          "src/test/",
          "**/*.d.ts",
          "**/*.config.*",
          "**/main.tsx",
          "**/vite-env.d.ts",
        ],
      },
    },
  }),
);
