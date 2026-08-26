#!/bin/bash
# Dev with the browser→Worker→MiniMax flow. Set VITE_LLM_PROXY_URL (and
# optionally run wrangler dev upstream) to exercise the proxy path in
# development — without doing a static build.
cd "$(dirname "$0")/.."
export PATH="$PWD/node_modules/.bin:$PATH"
exec env \
  VITE_LLM_PROXY_URL="${VITE_LLM_PROXY_URL:-http://127.0.0.1:8787/v1/chat/completions}" \
  node scripts/with-app-env.mjs vite dev --host 0.0.0.0 --port 8080
