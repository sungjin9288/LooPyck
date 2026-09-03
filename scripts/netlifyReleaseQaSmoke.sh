#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${SMOKE_BASE_URL:-https://loo-pyck.netlify.app}}"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
SESSION="${PLAYWRIGHT_CLI_SESSION:-nq-$(date +%s)}"
SEARCH_PLACEHOLDER='찾고 싶은 옷을 검색하세요'
SEARCH_QUERY='남자 후드'
CAPTURE_SCREENSHOTS="${RELEASE_QA_SCREENSHOTS:-0}"
DEMO_SCREENSHOT_DIR="$(pwd)/output/playwright"

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
    const match = text.match(/textbox \"찾고 싶은 옷을 검색하세요[^\n]*\[ref=(e\d+)\]/);
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

displayed_count() {
  printf '%s' "$1" | node -e "
    let text = '';
    process.stdin.on('data', (chunk) => text += chunk);
    process.stdin.on('end', () => {
      const match = text.match(/총\s*(\d+)개 아이템/);
      process.stdout.write(match ? match[1] : '0');
    });
  "
}

capture_demo_screenshot() {
  local file_name="$1"
  local capture_mode="${2:-viewport}"
  if [ "$CAPTURE_SCREENSHOTS" != "1" ]; then
    printf ''
    return 0
  fi

  mkdir -p "$DEMO_SCREENSHOT_DIR"
  local full_path="$DEMO_SCREENSHOT_DIR/$file_name"
  if [ "$capture_mode" = "full-page" ]; then
    pw screenshot --filename "$full_path" --full-page >/dev/null
  else
    pw screenshot --filename "$full_path" >/dev/null
  fi
  if [ ! -s "$full_path" ]; then
    echo "Demo screenshot was not created: ${full_path}" >&2
    return 1
  fi
  printf '%s' "$full_path"
}

poll_search_result() {
  local query="$1"
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
      && [[ "$body" != *"총 0개 아이템"* ]]; then
      printf '%s' "$body"
      return 0
    fi

    sleep 2
    attempts=$((attempts + 1))
  done

  echo "Timed out waiting for rendered result for query: $query" >&2
  return 1
}

resolve_detail_product() {
  local query="$1"
  local encoded_query
  encoded_query="$(node -e "process.stdout.write(encodeURIComponent(process.argv[1]));" "$query")"
  curl -s "${BASE_URL}/api/realtime-search?q=${encoded_query}&page=1&pageSize=1&sort=sim" | node -e "
    let text = '';
    process.stdin.on('data', (chunk) => text += chunk);
    process.stdin.on('end', () => {
      const payload = JSON.parse(text);
      const product = Array.isArray(payload.products) ? payload.products[0] : null;
      if (!product || !product.id || !product.source) {
        console.error('Unable to resolve detail product from realtime-search response.');
        process.exit(1);
      }
      const href = new URL('/product/' + encodeURIComponent(product.id), process.argv[1]);
      href.searchParams.set('source', product.source);
      href.searchParams.set('snapshot', Buffer.from(JSON.stringify(product), 'utf8').toString('base64url'));
      process.stdout.write(JSON.stringify({
        id: product.id,
        source: product.source,
        title: product.title || '',
        href: href.toString(),
      }));
    });
  " "$BASE_URL"
}

poll_detail_page() {
  local attempts=0
  local last_body=''
  while [ "$attempts" -lt 20 ]; do
    local body
    body="$(eval_result 'document.body.innerText')"
    last_body="$body"
    if [[ "$body" == *"Product Not Found"* ]]; then
      echo "Detail page resolved to Product Not Found" >&2
      return 1
    fi
    if [[ "$body" == *"고정 compare page입니다."* ]] \
      && [[ "$body" == *"선택 variant 기준 쇼핑몰 비교"* ]] \
      && [[ "$body" == *"선택 variant 가격 흐름"* ]]; then
      printf '%s' "$body"
      return 0
    fi
    sleep 2
    attempts=$((attempts + 1))
  done

  printf '%s' "$last_body" | node -e "
    let text = '';
    process.stdin.on('data', (chunk) => text += chunk);
    process.stdin.on('end', () => {
      const snippet = text.replace(/\s+/g, ' ').slice(0, 400);
      console.error('Timed out waiting for product detail page. Body snippet:', snippet);
    });
  " >&2
  return 1
}

poll_favorites_page() {
  local attempts=0
  local last_body=''
  while [ "$attempts" -lt 20 ]; do
    local body
    body="$(eval_result 'document.body.innerText')"
    last_body="$body"
    if [[ "$body" == *"My Lookbook"* ]] \
      && [[ "$body" == *"SAVED"* || "$body" == *"Saved"* ]] \
      && { [[ "$body" == *"찜한 상품이 없습니다"* ]] || [[ "$body" == *"전체 저장 항목"* ]]; }; then
      printf '%s' "$body"
      return 0
    fi
    sleep 2
    attempts=$((attempts + 1))
  done

  mkdir -p output/playwright
  local debug_path="output/playwright/favorites-timeout-body.txt"
  local console_path="output/playwright/favorites-timeout-console.txt"
  local network_path="output/playwright/favorites-timeout-network.txt"
  printf '%s\n' "$last_body" > "$debug_path"
  pw console warning > "$console_path" 2>&1 || true
  pw network > "$network_path" 2>&1 || true
  printf '%s' "$last_body" | node -e "
    let text = '';
    process.stdin.on('data', (chunk) => text += chunk);
    process.stdin.on('end', () => {
      const snippet = text.replace(/\s+/g, ' ').slice(0, 400);
      console.error(
        'Timed out waiting for favorites page.',
        'Debug body:', process.argv[1],
        'Console:', process.argv[2],
        'Network:', process.argv[3],
        'Body snippet:', snippet
      );
    });
  " "$debug_path" "$console_path" "$network_path" >&2
  return 1
}

cleanup() {
  pw close >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo "[ntl:release-qa-smoke] provenance -> ${BASE_URL}" >&2
DEPLOYMENT_PROVENANCE="$(node scripts/netlifyDeploymentProvenanceSmoke.mjs "$BASE_URL")"

echo "[ntl:release-qa-smoke] open -> ${BASE_URL}" >&2
OPEN_OUTPUT="$(pw open "$BASE_URL")"
pw resize 1440 1100 >/dev/null
SNAPSHOT_PATH="$(snapshot_path_from_output "$OPEN_OUTPUT")"
if [ -z "$SNAPSHOT_PATH" ]; then
  echo "Initial snapshot path not found" >&2
  exit 1
fi

TEXTBOX_REF="$(search_ref_from_snapshot "$SNAPSHOT_PATH")"
MAIN_SEARCH_SCREENSHOT="$(capture_demo_screenshot 'demo-flow-main-search.png')"

echo "[ntl:release-qa-smoke] search -> ${SEARCH_QUERY}" >&2
pw fill "$TEXTBOX_REF" "$SEARCH_QUERY" >/dev/null
pw press Enter >/dev/null
SEARCH_BODY="$(poll_search_result "$SEARCH_QUERY")"
SEARCH_COUNT="$(displayed_count "$SEARCH_BODY")"
SEARCH_RESULTS_SCREENSHOT="$(capture_demo_screenshot 'demo-flow-search-results.png')"

DETAIL_PRODUCT_JSON="$(resolve_detail_product "$SEARCH_QUERY")"
DETAIL_PAGE_HREF="$(printf '%s' "$DETAIL_PRODUCT_JSON" | node -e "
  let text = '';
  process.stdin.on('data', (chunk) => text += chunk);
  process.stdin.on('end', () => process.stdout.write(JSON.parse(text).href));
")"
DETAIL_PRODUCT_TITLE="$(printf '%s' "$DETAIL_PRODUCT_JSON" | node -e "
  let text = '';
  process.stdin.on('data', (chunk) => text += chunk);
  process.stdin.on('end', () => process.stdout.write(JSON.parse(text).title || ''));
")"

echo "[ntl:release-qa-smoke] open -> detail page" >&2
pw open "$DETAIL_PAGE_HREF" >/dev/null
pw resize 1440 1100 >/dev/null
DETAIL_PAGE_BODY="$(poll_detail_page)"
DETAIL_PAGE_FINAL_HREF="$(eval_result 'window.location.href')"
DETAIL_VARIANT_KEY="$(printf '%s' "$DETAIL_PAGE_FINAL_HREF" | node -e "
  let text = '';
  process.stdin.on('data', (chunk) => text += chunk);
  process.stdin.on('end', () => process.stdout.write(new URL(text).searchParams.get('variantKey') || ''));
")"
if printf '%s' "$DETAIL_VARIANT_KEY" | grep -Eiq '(찜한?|장바구니|구매하기|바로[[:space:]]*구매|add[[:space:]]+to[[:space:]]+(cart|bag|wishlist)|buy[[:space:]]+now|wishlist|favorite)'; then
  echo "Detail page variantKey contains a commerce action label: ${DETAIL_VARIANT_KEY}" >&2
  exit 1
fi
DETAIL_SCREENSHOT="$(capture_demo_screenshot 'demo-flow-detail-compare.png' 'full-page')"

echo "[ntl:release-qa-smoke] open -> favorites" >&2
pw open "${BASE_URL}/favorites" >/dev/null
pw resize 1440 1100 >/dev/null
FAVORITES_BODY="$(poll_favorites_page)"
FAVORITES_SCREENSHOT="$(capture_demo_screenshot 'demo-flow-favorites.png')"
WORKSPACE_PROVENANCE="$(node scripts/gitWorkspaceProvenance.mjs)"

node -e "
  const baseUrl = new URL(process.argv[1]);
  const isLocalTarget = ['localhost', '127.0.0.1', '::1'].includes(baseUrl.hostname);
  const output = {
    generatedAt: new Date().toISOString(),
    baseUrl: process.argv[1],
    targetKind: isLocalTarget ? 'local-working-tree' : 'deployed-environment',
    session: process.argv[2],
    runnerWorkspace: JSON.parse(process.argv[9]),
    deploymentProvenance: JSON.parse(process.argv[17]),
    scopeNote: isLocalTarget
      ? 'This result links local behavior to the working-tree fingerprint and deployment manifest recorded in this summary.'
      : 'This result links target behavior to the validated deployment manifest recorded in this summary.',
    searchQuery: process.argv[3],
    searchDisplayedCount: Number(process.argv[4]),
    detailPage: {
      href: process.argv[5],
      title: process.argv[6],
      hasCompareIntro: process.argv[7].includes('고정 compare page입니다.'),
      hasCompareSection: process.argv[7].includes('선택 variant 기준 쇼핑몰 비교'),
      hasPriceHistorySection: process.argv[7].includes('선택 variant 가격 흐름'),
      finalHref: process.argv[10],
      variantKey: process.argv[11] || null,
      hasCleanVariantIdentity: true,
    },
    favorites: {
      hasLookbookHeader: process.argv[8].includes('My Lookbook'),
      hasSavedSummary: /saved/i.test(process.argv[8]),
      hasGuestEmptyState: process.argv[8].includes('찜한 상품이 없습니다'),
    },
    screenshots: {
      enabled: process.argv[12] === '1',
      mainSearch: process.argv[13] || null,
      searchResults: process.argv[14] || null,
      detailCompare: process.argv[15] || null,
      favorites: process.argv[16] || null,
    },
  };
  process.stdout.write(JSON.stringify(output, null, 2));
" \
  "$BASE_URL" \
  "$SESSION" \
  "$SEARCH_QUERY" \
  "$SEARCH_COUNT" \
  "$DETAIL_PAGE_HREF" \
  "$DETAIL_PRODUCT_TITLE" \
  "$DETAIL_PAGE_BODY" \
  "$FAVORITES_BODY" \
  "$WORKSPACE_PROVENANCE" \
  "$DETAIL_PAGE_FINAL_HREF" \
  "$DETAIL_VARIANT_KEY" \
  "$CAPTURE_SCREENSHOTS" \
  "$MAIN_SEARCH_SCREENSHOT" \
  "$SEARCH_RESULTS_SCREENSHOT" \
  "$DETAIL_SCREENSHOT" \
  "$FAVORITES_SCREENSHOT" \
  "$DEPLOYMENT_PROVENANCE"
