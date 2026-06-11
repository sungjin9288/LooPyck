#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${SMOKE_BASE_URL:-https://loo-pyck.netlify.app}}"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
SESSION="${PLAYWRIGHT_CLI_SESSION:-ceb-$(date +%s)}"
WORKDIR="$(pwd)"
OUTPUT_DIR="$WORKDIR/output/playwright"
OUTPUT_PATH="$OUTPUT_DIR/netlify-compare-entry-baseline.json"
SEARCH_PLACEHOLDER='찾고 싶은 옷을 검색하세요'
SEARCH_QUERY='남자 후드'

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
      const match = text.match(/### Result\n([\s\S]*?)\n### Ran Playwright code/);
      if (!match) {
        console.error('Eval result not found');
        process.exit(1);
      }
      const value = JSON.parse(match[1].trim());
      process.stdout.write(typeof value === 'string' ? value : JSON.stringify(value));
    });
  "
}

take_screenshot() {
  local file_name="$1"
  local full_path="$OUTPUT_DIR/$file_name"
  mkdir -p "$OUTPUT_DIR"
  pw run-code "await page.screenshot({ path: ${full_path@Q}, fullPage: true });" >/dev/null
  printf '%s' "$full_path"
}

wait_for_search_surface() {
  local expected_url="$1"
  local attempts=0
  while [ "$attempts" -lt 20 ]; do
    local payload
    payload="$(eval_result "() => {
      const input = document.querySelector('input[placeholder*=\"${SEARCH_PLACEHOLDER}\"]');
      return {
        url: window.location.href,
        hasSearchInput: Boolean(input),
      };
    }")"
    local has_input
    has_input="$(printf '%s' "$payload" | node -e "
      let text = '';
      process.stdin.on('data', (chunk) => text += chunk);
      process.stdin.on('end', () => process.stdout.write(String(JSON.parse(text).hasSearchInput)));
    ")"
    local current_url
    current_url="$(printf '%s' "$payload" | node -e "
      let text = '';
      process.stdin.on('data', (chunk) => text += chunk);
      process.stdin.on('end', () => process.stdout.write(String(JSON.parse(text).url)));
    ")"
    if [ "$has_input" = "true" ] && [ "$current_url" = "$expected_url" ]; then
      return 0
    fi
    sleep 1
    attempts=$((attempts + 1))
  done

  echo "Timed out waiting for search surface: $expected_url" >&2
  return 1
}

poll_search_result() {
  local query="$1"
  local attempts=0
  while [ "$attempts" -lt 20 ]; do
    local payload
    payload="$(eval_result "() => {
      const params = new URLSearchParams(window.location.search);
      const input = document.querySelector('input[placeholder*=\"${SEARCH_PLACEHOLDER}\"]');
      const body = document.body.innerText || '';
      const totalMatch = body.match(/총\\s*(\\d+)개 아이템/);
      return {
        query: params.get('q') || '',
        inputValue: input?.value || '',
        displayedCount: totalMatch ? Number(totalMatch[1]) : 0,
        loading: body.includes('검색 결과를 불러오는 중입니다'),
      };
    }")"
    local current_query
    current_query="$(printf '%s' "$payload" | node -e "
      let text = '';
      process.stdin.on('data', (chunk) => text += chunk);
      process.stdin.on('end', () => process.stdout.write(String(JSON.parse(text).query)));
    ")"
    local input_value
    input_value="$(printf '%s' "$payload" | node -e "
      let text = '';
      process.stdin.on('data', (chunk) => text += chunk);
      process.stdin.on('end', () => process.stdout.write(String(JSON.parse(text).inputValue)));
    ")"
    local count
    count="$(printf '%s' "$payload" | node -e "
      let text = '';
      process.stdin.on('data', (chunk) => text += chunk);
      process.stdin.on('end', () => process.stdout.write(String(JSON.parse(text).displayedCount)));
    ")"
    local loading
    loading="$(printf '%s' "$payload" | node -e "
      let text = '';
      process.stdin.on('data', (chunk) => text += chunk);
      process.stdin.on('end', () => process.stdout.write(String(JSON.parse(text).loading)));
    ")"
    if [ "$current_query" = "$query" ] && [ "$input_value" = "$query" ] && [ "$loading" = "false" ] && [ "$count" -gt 0 ]; then
      printf '%s' "$payload"
      return 0
    fi
    sleep 2
    attempts=$((attempts + 1))
  done

  echo "Timed out waiting for search result: $query" >&2
  return 1
}

cleanup() {
  pw close >/dev/null 2>&1 || true
}

trap cleanup EXIT

mkdir -p "$OUTPUT_DIR"

BRAND_URL="${BASE_URL}/brand/musinsa"
CATEGORY_URL="${BASE_URL}/category/sneakers"
SEARCH_URL="${BASE_URL}/?q=$(node -e "process.stdout.write(encodeURIComponent(process.argv[1]));" "$SEARCH_QUERY")&sort=sim"

echo "[ntl:compare-entry-baseline] open -> ${BRAND_URL}" >&2
pw open "$BRAND_URL" >/dev/null
wait_for_search_surface "$BRAND_URL"
BRAND_SCREENSHOT="$(take_screenshot 'brand.png')"

echo "[ntl:compare-entry-baseline] open -> ${CATEGORY_URL}" >&2
pw open "$CATEGORY_URL" >/dev/null
wait_for_search_surface "$CATEGORY_URL"
CATEGORY_SCREENSHOT="$(take_screenshot 'category.png')"

echo "[ntl:compare-entry-baseline] open -> ${SEARCH_URL}" >&2
pw open "$SEARCH_URL" >/dev/null
SEARCH_PAYLOAD="$(poll_search_result "$SEARCH_QUERY")"
SEARCH_COUNT="$(printf '%s' "$SEARCH_PAYLOAD" | node -e "
  let text = '';
  process.stdin.on('data', (chunk) => text += chunk);
  process.stdin.on('end', () => process.stdout.write(String(JSON.parse(text).displayedCount)));
")"
SEARCH_SCREENSHOT="$(take_screenshot 'search-results-longwait.png')"

node -e "
  const fs = require('node:fs');
  const outputPath = process.argv[1];
  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: process.argv[2],
    session: process.argv[3],
    routes: {
      brand: process.argv[4],
      category: process.argv[5],
      search: process.argv[6],
    },
    screenshots: {
      brand: process.argv[7],
      category: process.argv[8],
      search: process.argv[9],
    },
    search: {
      query: process.argv[10],
      displayedCount: Number(process.argv[11]),
    },
  };
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  process.stdout.write(JSON.stringify({ ...summary, outputPath }, null, 2));
  process.stdout.write('\n');
" \
  "$OUTPUT_PATH" \
  "$BASE_URL" \
  "$SESSION" \
  "$BRAND_URL" \
  "$CATEGORY_URL" \
  "$SEARCH_URL" \
  "$BRAND_SCREENSHOT" \
  "$CATEGORY_SCREENSHOT" \
  "$SEARCH_SCREENSHOT" \
  "$SEARCH_QUERY" \
  "$SEARCH_COUNT"
