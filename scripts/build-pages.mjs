import { spawn } from "node:child_process";
import { copyFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".output/public");

// GitHub Pages project pages serve the publish root at BOTH `/` and
// `/<repo>/`. The SPA's index.html sits at the publish root with
// relative asset URLs so it works at either URL; this script just adds
// the SPA routing fallback (so unknown paths return the app shell) and
// the `.nojekyll` marker.

const child = spawn(
  process.execPath,
  [
    join(root, "node_modules/vite/bin/vite.js"),
    "build",
    "--config",
    "vite.pages.config.ts",
  ],
  { cwd: root, stdio: "inherit", env: process.env },
);

child.on("exit", (code) => {
  if (code !== 0) process.exit(code ?? 1);
  copyFileSync(join(out, "index.html"), join(out, "404.html"));
  writeFileSync(join(out, ".nojekyll"), "\n");
  process.exit(0);
});
