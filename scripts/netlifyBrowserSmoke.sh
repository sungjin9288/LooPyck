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
  local attempts=0

  while [ "$attempts" -lt 20 ]; do
    local current_query
    current_query="$(eval_result "new URLSearchParams(window.location.search).get('q') || ''")"
    local input_value
    input_value="$(eval_result "document.querySelector('input[placeholder*=\"${SEARCH_PLACEHOLDER}\"]')?.value || ''")"
    local body
    body="$(eval_result 'document.body.innerText')"
    local count
    count="$(displayed_count "$body")"

    if [ "$current_query" = "$query" ] \
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
    local current_url
    current_url="$(eval_result 'window.location.href')"
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
    if [[ "$current_url" != "${BASE_URL}/admin" ]] && [[ "$current_url" != "${BASE_URL}/admin/" ]]; then
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
pw open "$BASE_URL" >/dev/null

echo "[ntl:browser-smoke] search -> 남자 후드" >&2
pw open "${BASE_URL}/?q=%EB%82%A8%EC%9E%90%20%ED%9B%84%EB%93%9C" >/dev/null
BODY_ONE="$(poll_search_result "남자 후드")"
COUNT_ONE="$(displayed_count "$BODY_ONE")"

echo "[ntl:browser-smoke] search -> 운동용 후드" >&2
pw open "${BASE_URL}/?q=%EC%9A%B4%EB%8F%99%EC%9A%A9%20%ED%9B%84%EB%93%9C" >/dev/null
BODY_TWO="$(poll_search_result "운동용 후드" "$BODY_ONE")"
COUNT_TWO="$(displayed_count "$BODY_TWO")"

echo "[ntl:browser-smoke] verify -> /admin gate" >&2
pw open "${BASE_URL}/admin" >/dev/null
ADMIN_BODY="$(poll_admin_gate)"
ADMIN_URL="$(eval_result 'window.location.href')"

ADMIN_GATE="sign-in-required"
if [[ "$ADMIN_URL" != "${BASE_URL}/admin" ]] && [[ "$ADMIN_URL" != "${BASE_URL}/admin/" ]]; then
  ADMIN_GATE="redirect-home"
elif [[ "$ADMIN_BODY" == *"Sign In Required"* ]]; then
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
