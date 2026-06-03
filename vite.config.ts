import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import path from "path";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import unusedCode from "vite-plugin-unused-code";

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    unusedCode({
      patterns: ["src/**/*.*"],
      failOnHint: true,
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
