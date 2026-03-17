#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${SMOKE_BASE_URL:-https://loo-pyck.netlify.app}}"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
SESSION="${PLAYWRIGHT_CLI_SESSION:-na-$(date +%s)}"

pw() {
  PLAYWRIGHT_CLI_SESSION="$SESSION" CODEX_HOME="$CODEX_HOME" "$PWCLI" "$@"
}

eval_result() {
  local expression="$1"
  local output
  output="$(pw eval "$expression")"
  printf '%s' "$output" | node -e "
    let text = '';
    process.stdin.on('data', (chunk) => text += chunk);
    process.stdin.on('end', () => {
      const match = text.match(/### Result\\n([\\s\\S]*?)\\n### Ran Playwright code/);
      if (!match) {
        console.error('Eval result not found');
        process.exit(1);
      }
      const value = JSON.parse(match[1].trim());
      process.stdout.write(typeof value === 'string' ? value : JSON.stringify(value));
    });
  "
}

cleanup() {
  pw close >/dev/null 2>&1 || true
}

trap cleanup EXIT

AUTH_PAYLOAD_JSON="$(node -e "import('./scripts/netlifyAdminAuth.mjs').then(async (mod) => { const payload = await mod.createNetlifyAdminAuthPayload(); process.stdout.write(JSON.stringify(payload)); }).catch((error) => { console.error(error.message); process.exit(1); });")"

CUSTOM_TOKEN="$(printf '%s' "$AUTH_PAYLOAD_JSON" | node -e "let data=''; process.stdin.on('data', (chunk) => data += chunk); process.stdin.on('end', () => process.stdout.write(JSON.parse(data).customToken));")"

echo "[ntl:admin-browser-smoke] open -> ${BASE_URL}" >&2
LOGIN_URL="${BASE_URL}/login?next=%2Fadmin#customToken=${CUSTOM_TOKEN}"
pw open "${LOGIN_URL}" >/dev/null

echo "[ntl:admin-browser-smoke] verify -> /admin terminal surface" >&2

poll_terminal_surface() {
  local attempts=0
  local last_headings='[]'
  while [ "$attempts" -lt 20 ]; do
    local headings
    headings="$(eval_result "() => Array.from(document.querySelectorAll('h2, h3')).map((el) => el.textContent?.trim()).filter(Boolean)")"
    last_headings="$headings"
    if node -e "
      const headings = JSON.parse(process.argv[1]);
      const hasAll = [
        'Search Learning Terminal Overview',
        'Search Learning Terminal Validation',
        'Search Learning Terminal Handoff',
        'Search Learning Terminal Command Center',
      ].every((needle) => headings.includes(needle));
      process.exit(hasAll ? 0 : 1);
    " "$headings"; then
      printf '%s' "$headings"
      return 0
    fi

    sleep 2
    attempts=$((attempts + 1))
  done

  if node -e "
    const headings = JSON.parse(process.argv[1]);
    const gated = headings.includes('Sign In Required');
    process.exit(gated ? 0 : 1);
  " "$last_headings"; then
    echo "Admin browser smoke remained on sign-in gate" >&2
  fi
  echo "Timed out waiting for authenticated /admin terminal surface" >&2
  return 1
}

ADMIN_HEADINGS_JSON="$(poll_terminal_surface)"
ADMIN_SNIPPET="$(printf '%s' "$ADMIN_HEADINGS_JSON" | sed 's/"/\\"/g')"

cat <<EOF
{
  "baseUrl": "$(printf '%s' "$BASE_URL")",
  "session": "$(printf '%s' "$SESSION")",
  "terminalSurface": {
    "overview": true,
    "validation": true,
    "handoff": true,
    "commandCenter": true
  },
  "adminHeadings": ${ADMIN_HEADINGS_JSON},
  "adminSnippet": "${ADMIN_SNIPPET}"
}
EOF
