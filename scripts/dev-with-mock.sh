#!/bin/bash
# Dev with a local mock LLM. Useful for end-to-end smoke testing of the
# analyze + report + git push pipeline without burning real API credits.
cd "$(dirname "$0")/.."
export PATH="$PWD/node_modules/.bin:$PATH"
exec env \
  MiniMax_BASE_URL="${MiniMax_BASE_URL:-http://localhost:9999/v1}" \
  MiniMax_API_KEY="${MiniMax_API_KEY:-mock-key}" \
  MiniMax_MODEL="${MiniMax_MODEL:-MiniMax-Text-01}" \
  AUTO_GIT_PUSH="${AUTO_GIT_PUSH:-0}" \
  node scripts/with-app-env.mjs vite dev --host 0.0.0.0 --port 8080
