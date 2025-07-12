import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: "index.html",
      formats: ["es"],
    },
    rollupOptions: {
      external: /^lit/,
    },
    target: "es2022",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
});
