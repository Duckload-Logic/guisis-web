/// <reference types="vitest" />
import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import path from "path";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import unusedCode from "vite-plugin-unused-code";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
  plugins: [
    react(),
    svgr(),
    unusedCode({
      patterns: ["src/**/*.*"],
      failOnHint: false,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});