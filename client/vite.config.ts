/// <reference types="vitest" />
import { defineConfig, mergeConfig } from "vite";
import { defineConfig as defineTestConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default mergeConfig(
  defineConfig({
    plugins: [react(), tsconfigPaths()],
    server: {
      proxy: {
        // Proxy API requests to backend server
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
          secure: false,
        },
        // Also proxy OAuth callback routes
        "/v1": {
          target: "http://localhost:8080",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: './index.html',
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@heroui/react', '@iconify/react'],
          },
        },
      },
    },
    // For static generation, we'll prerender these routes
    ssr: {
      // Add any server-side dependencies here if needed
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
