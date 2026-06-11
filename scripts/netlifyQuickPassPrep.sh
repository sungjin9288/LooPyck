#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${SMOKE_BASE_URL:-https://loo-pyck.netlify.app}}"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
WORKDIR="$(pwd)"
OUTPUT_DIR="$WORKDIR/output/playwright"
OUTPUT_PATH="$OUTPUT_DIR/netlify-quick-pass-prep.json"

mkdir -p "$OUTPUT_DIR"
if [ ! -x "$PWCLI" ]; then
  echo "Playwright CLI helper not found at $PWCLI" >&2
  exit 1
fi

node -e "
  const fs = require('node:fs');
  const path = require('node:path');
  const outputPath = process.argv[1];
  const baseUrl = process.argv[2];
  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    reset: {
      ok: true,
      command: '$HOME/.codex/skills/playwright/scripts/playwright_cli.sh close-all',
    },
    urls: {
      brand: baseUrl + '/brand/musinsa',
      category: baseUrl + '/category/sneakers',
      home: baseUrl + '/?q=' + encodeURIComponent('남자 후드') + '&sort=sim',
      admin: baseUrl + '/admin',
    },
    checks: [
      'brand/category compare entry hero and decision lens render without layout break',
      'brand/category direct search entry routes into home search results',
      'home search keeps query and sort aligned with URL state',
      'guest shortlist re-entry remains visible when shortlist exists',
      'admin gate stays closed for unauthenticated quick pass',
    ],
    note: 'Run $HOME/.codex/skills/playwright/scripts/playwright_cli.sh close-all first, then run this helper after npm run ntl:uat and before Playwright MCP manual quick pass to avoid stale Chrome session collisions.',
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  process.stdout.write(JSON.stringify({ ...summary, outputPath }, null, 2));
  process.stdout.write('\n');
" "$OUTPUT_PATH" "$BASE_URL"
