import { spawn } from "node:child_process";
import { copyFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".output/public");
const spa = join(out, "mma");
const target = "/mma/";

// Root index.html — meta-refresh redirect into the project page subpath.
// A bare `<meta http-equiv="refresh">` works on GitHub Pages (no
// .htaccess available) and degrades gracefully if JS is disabled.
const redirectHtml = `<!doctype html>
<html lang="zh-HK">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <link rel="canonical" href="${target}" />
    <title>蝶刺</title>
    <meta name="description" content="康文署 30 分鐘外圍拳擊自學：技術移動、體能、體重控制。" />
    <style>html,body{margin:0;height:100%;background:#10110f;color:#fafafa;font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif;display:flex;align-items:center;justify-content:center;text-align:center}a{color:#fb923c;text-decoration:none}a:hover{text-decoration:underline}</style>
  </head>
  <body>
    <p><a href="${target}">去到 蝶刺 →</a></p>
  </body>
</html>
`;

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
  // SPA routing fallback inside the project page.
  copyFileSync(join(spa, "index.html"), join(spa, "404.html"));
  // Publish root: redirector + 404 fallback + jekyll bypass.
  writeFileSync(join(out, "index.html"), redirectHtml);
  writeFileSync(join(out, "404.html"), redirectHtml);
  writeFileSync(join(out, ".nojekyll"), "\n");
  process.exit(0);
});
