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
    headers: {
      "Content-Security-Policy":
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; " +
        "connect-src 'self' http://localhost:8080 " +
        "ws://localhost:5173 " +
        "https://*.dllbsit2027.com;",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Strict-Transport-Security":
        "max-age=31536000; includeSubDomains",
      "X-XSS-Protection": "1; mode=block",
      "X-Robots-Tag": "noindex, nofollow",
    },
  },
});
