import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(rootDir, "spa"),
  base: "/mma/",
  publicDir: resolve(rootDir, "public"),
  envDir: rootDir,
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: { "@": resolve(rootDir, "src") },
  },
  define: {
    "import.meta.env.VITE_SPA": JSON.stringify("1"),
  },
  build: {
    outDir: resolve(rootDir, ".output/public"),
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
