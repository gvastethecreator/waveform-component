import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "waveform-component": fileURLToPath(new URL("./src/index.ts", import.meta.url)),
    },
  },
  build: {
    outDir: "dist-playground",
  },
  server: {
    host: "localhost",
    port: 3000,
  },
});
