/**
 * Cloudflare Worker that proxies chat-completion requests to MiniMax.
 *
 *  [Browser] --POST--> [Worker] --bearer--> [MiniMax API]
 *   (no key)         (holds key)        (api.MiniMax.chat)
 *
 * Deploy:
 *   cd workers/minimax-proxy
 *   npm install
 *   wrangler secret put MiniMax_API_KEY
 *   wrangler deploy
 *
 * Configure the SPA by setting `VITE_LLM_PROXY_URL` to the deployed worker URL
 * (e.g. https://MiniMax-proxy.<account>.workers.dev) at build time.
 */

interface Env {
  /** MiniMax API key. Set via `wrangler secret put MiniMax_API_KEY`. */
  MiniMax_API_KEY: string;
  /** Origin to allow via CORS. Defaults to the request's Origin, "*" if absent. */
  ALLOWED_ORIGIN?: string;
  /** Upstream chat-completions URL. Override in `.dev.vars` for local mocks. */
  MiniMax_BASE_URL?: string;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonError(message: string, status: number, origin: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin =
      env.ALLOWED_ORIGIN && env.ALLOWED_ORIGIN !== "*"
        ? env.ALLOWED_ORIGIN
        : req.headers.get("Origin") ?? "*";

    // CORS preflight — let the browser ask "is this safe to call?" first.
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname !== "/v1/chat/completions") {
      return jsonError("not found", 404, origin);
    }

    if (req.method !== "POST") {
      return jsonError("method not allowed", 405, origin);
    }

    if (!env.MiniMax_API_KEY) {
      return jsonError("MiniMax_API_KEY not configured on the worker", 500, origin);
    }

    const body = await req.text();
    const upstreamUrl = env.MiniMax_BASE_URL ?? "https://api.MiniMax.chat/v1/chat/completions";

    let upstream: Response;
    try {
      upstream = await fetch(upstreamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.MiniMax_API_KEY}`,
        },
        body,
      });
    } catch (err) {
      return jsonError(`upstream fetch failed: ${(err as Error).message}`, 502, origin);
    }

    // Pass through status + body, but always inject CORS headers so the
    // browser can read the response.
    const headers = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(corsHeaders(origin))) {
      headers.set(k, v);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
