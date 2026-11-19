#!/usr/bin/env bash
# Runs the @screens suite inside the pinned Playwright image so baselines match across hosts and CI.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(cd ../.. && pwd)"
PORT=4319
VERSION="$(node -p "require('@playwright/test/package.json').version")"

pnpm build

# Loopback is a secure context on every host; Desktop's HTTP host alias omits
# userAgentData and silently changes Quasar's native positioning engine.
docker run --rm --ipc host -u "$(id -u):$(id -g)" -e HOME=/tmp \
  -e ODS_SCREENS=1 -e ODS_BASE_URL="http://127.0.0.1:$PORT/" -e ODS_PREVIEW_PORT="$PORT" \
  -v "$ROOT:$ROOT" -w "$PWD" "mcr.microsoft.com/playwright:v$VERSION-noble" \
  bash -c '
    set -euo pipefail
    node_modules/.bin/vite preview --host 127.0.0.1 --port "$ODS_PREVIEW_PORT" --strictPort >/dev/null 2>&1 &
    PREVIEW=$!
    trap '\''kill "$PREVIEW" 2>/dev/null || true'\'' EXIT
    for _ in $(seq 1 120); do
      curl -sf "$ODS_BASE_URL" >/dev/null && break
      kill -0 "$PREVIEW"
      sleep 0.25
    done
    curl -sf "$ODS_BASE_URL" >/dev/null
    node_modules/.bin/playwright test "$@"
  ' ods-screens "$@"
