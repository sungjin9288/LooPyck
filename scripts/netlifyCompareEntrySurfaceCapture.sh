#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${SMOKE_BASE_URL:-https://loo-pyck.netlify.app}}"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
SESSION="${PLAYWRIGHT_CLI_SESSION:-cefs-$(date +%s)}"
WORKDIR="$(pwd)"
OUTPUT_DIR="$WORKDIR/output/playwright"
OUTPUT_PATH="$OUTPUT_DIR/netlify-compare-entry-surface-reference.json"
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

capture_locator() {
  local file_name="$1"
  local locator_expression="$2"
  local full_path="$OUTPUT_DIR/$file_name"
  mkdir -p "$OUTPUT_DIR"
  pw run-code "const locator = ${locator_expression}; await locator.scrollIntoViewIfNeeded(); await locator.screenshot({ path: ${full_path@Q} });" >/dev/null
  printf '%s' "$full_path"
}

seed_shortlist_fixture() {
  pw run-code "await page.evaluate(() => {
    const item = {
      title: '무신사 스탠다드 후드 집업',
      link: 'https://store.musinsa.com/app/goods/3890000',
      image: 'https://image.msscdn.net/images/goods_img/20240220/3890000/3890000_17150600000000_big.jpg',
      lprice: '59000',
      hprice: '0',
      mallName: '무신사 스토어',
      productId: 'surface-shortlist-demo',
      productType: 'fashion',
      brand: '무신사 스탠다드',
      maker: '무신사 스탠다드',
      category1: '패션의류',
      category2: '남성의류',
      category3: '후드집업',
      category4: '',
      source: 'musinsa',
      variantLabel: 'M / 블랙',
      deepLink: '/product/surface-shortlist-demo?source=musinsa&variantKey=default',
      savedAt: Date.now(),
    };
    localStorage.setItem('loopyck-compare-shortlist', JSON.stringify([item]));
    window.dispatchEvent(new CustomEvent('loopyck:compare-shortlist-changed', { detail: [item] }));
  });
  await page.locator('section:has-text(\"로그인 없이 저장한 비교 후보\")').first().waitFor({ state: 'visible', timeout: 10000 });" >/dev/null
}

clear_shortlist_fixture() {
  pw run-code "await page.evaluate(() => {
    localStorage.setItem('loopyck-compare-shortlist', JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('loopyck:compare-shortlist-changed', { detail: [] }));
  });" >/dev/null
}

cleanup() {
  pw close >/dev/null 2>&1 || true
}

trap cleanup EXIT

mkdir -p "$OUTPUT_DIR"

BRAND_URL="${BASE_URL}/brand/musinsa"
SEARCH_URL="${BASE_URL}/?q=$(node -e "process.stdout.write(encodeURIComponent(process.argv[1]));" "$SEARCH_QUERY")&sort=sim"

echo "[ntl:compare-entry-surfaces] open -> ${BRAND_URL}" >&2
pw open "$BRAND_URL" >/dev/null
wait_for_search_surface "$BRAND_URL"
BRAND_HERO_SCREENSHOT="$(capture_locator 'compare-entry-brand-hero.png' "page.locator('main > section').nth(0)")"
BRAND_ROUTES_SCREENSHOT="$(capture_locator 'compare-entry-brand-routes.png' "page.locator('main > section').nth(1)")"
seed_shortlist_fixture
BRAND_SHORTLIST_SCREENSHOT="$(capture_locator 'compare-entry-brand-shortlist.png' "page.locator('section:has-text(\"로그인 없이 저장한 비교 후보\")').first()")"
clear_shortlist_fixture

echo "[ntl:compare-entry-surfaces] open -> ${SEARCH_URL}" >&2
pw open "$SEARCH_URL" >/dev/null
SEARCH_PAYLOAD="$(poll_search_result "$SEARCH_QUERY")"
SEARCH_COUNT="$(printf '%s' "$SEARCH_PAYLOAD" | node -e "
  let text = '';
  process.stdin.on('data', (chunk) => text += chunk);
  process.stdin.on('end', () => process.stdout.write(String(JSON.parse(text).displayedCount)));
")"
SEARCH_SUMMARY_SCREENSHOT="$(capture_locator 'compare-entry-search-summary.png' "page.locator('section:has-text(\"최저 결제가\")').first()")"
SEARCH_HIGHLIGHTS_SCREENSHOT="$(capture_locator 'compare-entry-search-highlights.png' "page.locator('section:has-text(\"비교 하이라이트\")').first()")"
SEARCH_HIGHLIGHT_CARD_SCREENSHOT="$OUTPUT_DIR/compare-entry-search-highlight-card.png"
pw run-code "const card = page.locator('section:has-text(\"비교 하이라이트\") button').first(); await card.scrollIntoViewIfNeeded(); await card.screenshot({ path: ${SEARCH_HIGHLIGHT_CARD_SCREENSHOT@Q} });" >/dev/null
SEARCH_RESULT_CARD_SCREENSHOT="$OUTPUT_DIR/compare-entry-search-result-card.png"
pw run-code "const card = page.locator('div.relative.group.overflow-hidden.rounded-xl.bg-slate-100').first(); await card.scrollIntoViewIfNeeded(); await card.hover(); await page.waitForTimeout(200); await card.screenshot({ path: ${SEARCH_RESULT_CARD_SCREENSHOT@Q} });" >/dev/null

node -e "
  const fs = require('node:fs');
  const outputPath = process.argv[1];
  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: process.argv[2],
    session: process.argv[3],
    routes: {
      brand: process.argv[4],
      search: process.argv[5],
    },
    screenshots: {
      brandHero: process.argv[6],
      brandRoutes: process.argv[7],
      brandShortlist: process.argv[8],
      searchSummary: process.argv[9],
      searchHighlights: process.argv[10],
      searchHighlightCard: process.argv[11],
      searchResultCard: process.argv[12],
    },
    search: {
      query: process.argv[13],
      displayedCount: Number(process.argv[14]),
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
  "$SEARCH_URL" \
  "$BRAND_HERO_SCREENSHOT" \
  "$BRAND_ROUTES_SCREENSHOT" \
  "$BRAND_SHORTLIST_SCREENSHOT" \
  "$SEARCH_SUMMARY_SCREENSHOT" \
  "$SEARCH_HIGHLIGHTS_SCREENSHOT" \
  "$SEARCH_HIGHLIGHT_CARD_SCREENSHOT" \
  "$SEARCH_RESULT_CARD_SCREENSHOT" \
  "$SEARCH_QUERY" \
  "$SEARCH_COUNT"
