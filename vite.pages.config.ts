import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));

// The SPA is served at https://<user>.github.io/<repo>/ — i.e. the
// project-page subpath. We build into `.output/public/<repo>/` and drop a
// meta-refresh `index.html` at the publish root that redirects visitors
// to that subpath. Asset URLs in the SPA use relative paths (default
// base) so they resolve correctly under the subpath.
export default defineConfig({
  root: resolve(rootDir, "spa"),
  base: process.env.BASE_PATH || "./",
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
    outDir: resolve(rootDir, ".output/public/mma"),
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
