import { defineConfig } from "vite";
import deno from "@deno/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: "src/kin-form-example.ts",
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
  plugins: [deno()],
});
