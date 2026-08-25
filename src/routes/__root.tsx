import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "蝶刺";
const asset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const spa = import.meta.env.VITE_SPA === "1";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content: "康文署 30 分鐘外圍拳擊自學：技術移動、體能、體重控制。",
      },
      { name: "theme-color", content: "#10110f" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: asset("favicon.svg") },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Sans+TC:wght@400;500;600&family=Noto+Serif+TC:wght@500;600&display=swap",
      },
      { rel: "manifest", href: asset("__grok/manifest.webmanifest") },
      { rel: "apple-touch-icon", href: asset("__grok/icon-180.png") },
    ],
  }),
  component: RootShell,
});

function RootShell() {
  const inner = (
    <>
      <PreviewHostBridge />
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </>
  );
  if (spa) return inner;
  return (
    <html lang="zh-HK" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
        {inner}
        <Scripts />
      </body>
    </html>
  );
}
