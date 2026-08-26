#!/bin/bash
# Dev helper: start Vite with MiniMax test creds and AUTO_GIT_PUSH on.
# Used by the local smoke test — real keys come from the user's shell env.
cd "$(dirname "$0")/.."
# Add node_modules/.bin to PATH so the with-app-env wrapper can find `vite`,
# the way `npm run dev` would have.
export PATH="$PWD/node_modules/.bin:$PATH"
exec env MiniMax_API_KEY="${MiniMax_API_KEY:-test_dummy_key}" \
         AUTO_GIT_PUSH="${AUTO_GIT_PUSH:-1}" \
         node scripts/with-app-env.mjs vite dev --host 0.0.0.0 --port 8080
