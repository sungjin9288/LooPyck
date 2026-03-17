#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${SMOKE_BASE_URL:-https://loo-pyck.netlify.app}}"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
SESSION="${PLAYWRIGHT_CLI_SESSION:-ntl-$(date +%s)}"
SEARCH_PLACEHOLDER='찾고 싶은 옷을 검색하세요'

pw() {
  PLAYWRIGHT_CLI_SESSION="$SESSION" CODEX_HOME="$CODEX_HOME" "$PWCLI" "$@"
}

snapshot_path_from_output() {
  printf '%s\n' "$1" | sed -n 's/.*\[Snapshot\](\(.*\)).*/\1/p' | tail -n 1
}

search_ref_from_snapshot() {
  local snapshot_path="$1"
  node -e "
    const fs = require('fs');
    const text = fs.readFileSync(process.argv[1], 'utf8');
    const match = text.match(/textbox \"찾고 싶은 옷을 검색하세요[^\\n]*\\[ref=(e\\d+)\\]/);
    if (!match) {
      console.error('Search textbox ref not found in snapshot:', process.argv[1]);
      process.exit(1);
    }
    process.stdout.write(match[1]);
  " "$snapshot_path"
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
      process.stdout.write(String(value));
    });
  "
}

displayed_count() {
  printf '%s' "$1" | node -e "
    let text = '';
    process.stdin.on('data', (chunk) => text += chunk);
    process.stdin.on('end', () => {
      const match = text.match(/총\\s*(\\d+)개 아이템/);
      process.stdout.write(match ? match[1] : '0');
    });
  "
}

poll_search_result() {
  local query="$1"
  local previous_body="${2:-}"
  local expected_url="${BASE_URL}/?q=$(node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$query")"
  local attempts=0

  while [ "$attempts" -lt 20 ]; do
    local current_url
    current_url="$(eval_result 'window.location.href')"
    local input_value
    input_value="$(eval_result "document.querySelector('input[placeholder*=\"${SEARCH_PLACEHOLDER}\"]')?.value || ''")"
    local body
    body="$(eval_result 'document.body.innerText')"
    local count
    count="$(displayed_count "$body")"

    if [ "$current_url" = "$expected_url" ] \
      && [ "$input_value" = "$query" ] \
      && [ "$count" -gt 0 ] \
      && [[ "$body" != *"검색 결과를 불러오는 중입니다"* ]] \
      && [[ "$body" != *"총 0개 아이템"* ]] \
      && { [ -z "$previous_body" ] || [ "$body" != "$previous_body" ]; }; then
      printf '%s' "$body"
      return 0
    fi

    sleep 2
    attempts=$((attempts + 1))
  done

  echo "Timed out waiting for rendered result for query: $query" >&2
  return 1
}

poll_admin_gate() {
  local attempts=0
  while [ "$attempts" -lt 15 ]; do
    local body
    body="$(eval_result 'document.body.innerText')"
    if [[ "$body" == *"Search Learning Terminal Overview"* ]]; then
      echo "Authenticated admin view unexpectedly visible during unauthenticated smoke" >&2
      return 1
    fi
    if [[ "$body" == *"Sign In Required"* ]] \
      || [[ "$body" == *"먼저 로그인해야 합니다"* ]] \
      || [[ "$body" == *"관리자 진단 화면을 보려면 먼저 로그인"* ]]; then
      printf '%s' "$body"
      return 0
    fi
    sleep 2
    attempts=$((attempts + 1))
  done

  echo "Timed out waiting for unauthenticated /admin gate" >&2
  return 1
}

cleanup() {
  pw close >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo "[ntl:browser-smoke] open -> ${BASE_URL}" >&2
OPEN_OUTPUT="$(pw open "$BASE_URL")"
SNAPSHOT_PATH="$(snapshot_path_from_output "$OPEN_OUTPUT")"
if [ -z "$SNAPSHOT_PATH" ]; then
  echo "Initial snapshot path not found" >&2
  exit 1
fi

TEXTBOX_REF="$(search_ref_from_snapshot "$SNAPSHOT_PATH")"

echo "[ntl:browser-smoke] search -> 남자 후드" >&2
pw fill "$TEXTBOX_REF" "남자 후드" >/dev/null
pw press Enter >/dev/null
BODY_ONE="$(poll_search_result "남자 후드")"
COUNT_ONE="$(displayed_count "$BODY_ONE")"

SNAPSHOT_ONE="$(snapshot_path_from_output "$(pw snapshot)")"
TEXTBOX_REF="$(search_ref_from_snapshot "$SNAPSHOT_ONE")"

echo "[ntl:browser-smoke] search -> 운동용 후드" >&2
pw fill "$TEXTBOX_REF" "운동용 후드" >/dev/null
pw press Enter >/dev/null
BODY_TWO="$(poll_search_result "운동용 후드" "$BODY_ONE")"
COUNT_TWO="$(displayed_count "$BODY_TWO")"

echo "[ntl:browser-smoke] verify -> /admin gate" >&2
pw open "${BASE_URL}/admin" >/dev/null
ADMIN_BODY="$(poll_admin_gate)"

ADMIN_GATE="login-required"
if [[ "$ADMIN_BODY" == *"Sign In Required"* ]]; then
  ADMIN_GATE="sign-in-required"
fi

cat <<EOF
{
  "baseUrl": "$(printf '%s' "$BASE_URL")",
  "session": "$(printf '%s' "$SESSION")",
  "searches": [
    {
      "query": "남자 후드",
      "displayedCount": ${COUNT_ONE},
      "visibleQuery": "$(printf '%s' "남자 후드")"
    },
    {
      "query": "운동용 후드",
      "displayedCount": ${COUNT_TWO},
      "visibleQuery": "$(printf '%s' "운동용 후드")"
    }
  ],
  "adminGate": "${ADMIN_GATE}"
}
EOF
