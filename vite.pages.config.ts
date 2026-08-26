import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));

// Static SPA build for GitHub Pages. Project pages serve the repo root
// at BOTH `/<repo>/` and `/`, so we keep the SPA's `index.html` at the
// publish root and use relative asset paths so it works at either URL.
// `BASE_PATH` is intentionally not consulted here — set it to anything
// other than `./` and the assets will 404 under one of the two URLs.
export default defineConfig({
  root: resolve(rootDir, "spa"),
  base: "./",
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
