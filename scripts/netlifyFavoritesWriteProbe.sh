#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${SMOKE_BASE_URL:-https://loo-pyck.netlify.app}}"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
SESSION="${PLAYWRIGHT_CLI_SESSION:-nf-$(date +%s)}"
SEARCH_QUERY="${FAVORITES_PROBE_QUERY:-남자 후드}"
APP_ID="${FAVORITES_PROBE_APP_ID:-default-app-id}"
PROBE_FAVORITE_ID=''

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

json_field() {
  local json="$1"
  local field="$2"
  node -e "
    const data = JSON.parse(process.argv[1]);
    const value = data[process.argv[2]];
    if (value === undefined || value === null) process.exit(1);
    process.stdout.write(String(value));
  " "$json" "$field"
}

cleanup() {
  if [ -n "$PROBE_FAVORITE_ID" ] && [ -n "$APP_ID" ]; then
    node scripts/netlifyFavoritesWriteProbe.mjs cleanup "$BASE_URL" "$APP_ID" "$PROBE_FAVORITE_ID" >/dev/null 2>&1 || true
  fi
  pw close >/dev/null 2>&1 || true
}

trap cleanup EXIT

poll_favorites_loaded() {
  local attempts=0
  while [ "$attempts" -lt 20 ]; do
    local payload
    payload="$(eval_result "() => {
      const body = document.body.innerText || '';
      const totalMatch = body.match(/SAVED\\s*(\\d+)/i);
      return {
        ready: body.includes('My Lookbook') && /saved/i.test(body),
        total: totalMatch ? Number(totalMatch[1]) : null,
      };
    }")"
    if [ "$(json_field "$payload" ready)" = "true" ]; then
      printf '%s' "$payload"
      return 0
    fi
    sleep 2
    attempts=$((attempts + 1))
  done

  echo "Timed out waiting for favorites page" >&2
  return 1
}

poll_favorites_contains() {
  local title="$1"
  local expected_total="$2"
  local attempts=0
  while [ "$attempts" -lt 20 ]; do
    local payload
    payload="$(eval_result "() => {
      const expected = ${title@Q};
      const body = document.body.innerText || '';
      const totalMatch = body.match(/SAVED\\s*(\\d+)/i);
      return {
        total: totalMatch ? Number(totalMatch[1]) : null,
        hasTitle: body.includes(expected),
      };
    }")"
    local total
    total="$(json_field "$payload" total)"
    local has_title
    has_title="$(json_field "$payload" hasTitle)"
    if [ "$has_title" = "true" ] && [ "$total" = "$expected_total" ]; then
      printf '%s' "$payload"
      return 0
    fi
    sleep 2
    attempts=$((attempts + 1))
  done

  echo "Timed out waiting for added favorite to appear in favorites page" >&2
  return 1
}

poll_favorites_removed() {
  local title="$1"
  local expected_total="$2"
  local attempts=0
  while [ "$attempts" -lt 20 ]; do
    local payload
    payload="$(eval_result "() => {
      const expected = ${title@Q};
      const body = document.body.innerText || '';
      const totalMatch = body.match(/SAVED\\s*(\\d+)/i);
      return {
        total: totalMatch ? Number(totalMatch[1]) : null,
        hasTitle: body.includes(expected),
      };
    }")"
    local total
    total="$(json_field "$payload" total)"
    local has_title
    has_title="$(json_field "$payload" hasTitle)"
    if [ "$has_title" = "false" ] && [ "$total" = "$expected_total" ]; then
      printf '%s' "$payload"
      return 0
    fi
    sleep 2
    attempts=$((attempts + 1))
  done

  echo "Timed out waiting for removed favorite to disappear from favorites page" >&2
  return 1
}

poll_compare_page_loaded() {
  local deep_link="$1"
  local title="$2"
  local attempts=0
  while [ "$attempts" -lt 20 ]; do
    local payload
    payload="$(eval_result "() => {
      const expectedPath = ${deep_link@Q};
      const expectedTitle = ${title@Q};
      const expectedUrl = new URL(expectedPath, window.location.origin);
      const currentUrl = new URL(window.location.href);
      const body = document.body.innerText || '';
      return {
        matchesPath: currentUrl.pathname === expectedUrl.pathname,
        matchesSource: currentUrl.searchParams.get('source') === expectedUrl.searchParams.get('source'),
        matchesVariantKey: currentUrl.searchParams.get('variantKey') === expectedUrl.searchParams.get('variantKey'),
        hasTitle: body.includes(expectedTitle),
        hasCompareIntro: body.includes('고정 compare page입니다.'),
        hasMallCompare: body.includes('선택 variant 기준 쇼핑몰 비교'),
        hasPriceHistory: body.includes('선택 variant 가격 흐름'),
      };
    }")"
    local matches_path
    matches_path="$(json_field "$payload" matchesPath)"
    local matches_source
    matches_source="$(json_field "$payload" matchesSource)"
    local matches_variant
    matches_variant="$(json_field "$payload" matchesVariantKey)"
    local has_title
    has_title="$(json_field "$payload" hasTitle)"
    local has_compare_intro
    has_compare_intro="$(json_field "$payload" hasCompareIntro)"
    local has_mall_compare
    has_mall_compare="$(json_field "$payload" hasMallCompare)"
    local has_price_history
    has_price_history="$(json_field "$payload" hasPriceHistory)"
    if [ "$matches_path" = "true" ] \
      && [ "$matches_source" = "true" ] \
      && [ "$matches_variant" = "true" ] \
      && [ "$has_title" = "true" ] \
      && [ "$has_compare_intro" = "true" ] \
      && [ "$has_mall_compare" = "true" ] \
      && [ "$has_price_history" = "true" ]; then
      printf '%s' "$payload"
      return 0
    fi
    sleep 2
    attempts=$((attempts + 1))
  done

  echo "Timed out waiting for compare page deep link to load" >&2
  return 1
}

click_favorite_compare_link() {
  local deep_link="$1"
  local title="$2"
  local clicked
  clicked="$(eval_result "() => {
    const expectedPath = ${deep_link@Q};
    const expectedTitle = ${title@Q};
    const link = Array.from(document.querySelectorAll('a')).find((anchor) => {
      const href = anchor.getAttribute('href');
      const text = anchor.textContent?.trim() || '';
      if (href !== expectedPath || !text.includes('비교 페이지')) {
        return false;
      }

      const cardText = anchor.closest('div')?.innerText || document.body.innerText || '';
      return cardText.includes(expectedTitle);
    });

    if (!link) {
      return false;
    }

    link.click();
    return true;
  }")"
  if [ "$clicked" != "true" ]; then
    echo "Compare link not found in favorites page" >&2
    return 1
  fi
}

AUTH_PAYLOAD_JSON="$(node -e "import('./scripts/netlifyAdminAuth.mjs').then(async (mod) => { const payload = await mod.createNetlifyAdminAuthPayload(); process.stdout.write(JSON.stringify(payload)); }).catch((error) => { console.error(error.message); process.exit(1); });")"
CUSTOM_TOKEN="$(printf '%s' "$AUTH_PAYLOAD_JSON" | node -e "let data=''; process.stdin.on('data', (chunk) => data += chunk); process.stdin.on('end', () => process.stdout.write(JSON.parse(data).customToken));")"

echo "[ntl:favorites-probe] write -> firestore probe document" >&2
PREPARE_JSON="$(node scripts/netlifyFavoritesWriteProbe.mjs prepare "$BASE_URL" "$APP_ID" "$SEARCH_QUERY")"
PROBE_FAVORITE_ID="$(json_field "$PREPARE_JSON" favoriteId)"
BASELINE_TOTAL="$(json_field "$PREPARE_JSON" beforeCount)"
ADDED_TOTAL="$(json_field "$PREPARE_JSON" afterAddCount)"
ADDED_TITLE="$(json_field "$PREPARE_JSON" title)"
DEEP_LINK="$(json_field "$PREPARE_JSON" deepLink)"

echo "[ntl:favorites-probe] verify -> favorites contains added item" >&2
pw open "${BASE_URL}/login?next=%2Ffavorites#customToken=${CUSTOM_TOKEN}" >/dev/null
pw run-code "async (page) => { await page.waitForTimeout(12000); }" >/dev/null
poll_favorites_loaded >/dev/null
poll_favorites_contains "$ADDED_TITLE" "$ADDED_TOTAL" >/dev/null

echo "[ntl:favorites-probe] verify -> favorites compare link click-through" >&2
click_favorite_compare_link "$DEEP_LINK" "$ADDED_TITLE"
pw run-code "async (page) => { await page.waitForTimeout(12000); }" >/dev/null
poll_compare_page_loaded "$DEEP_LINK" "$ADDED_TITLE" >/dev/null

echo "[ntl:favorites-probe] cleanup -> firestore probe document" >&2
CLEANUP_JSON="$(node scripts/netlifyFavoritesWriteProbe.mjs cleanup "$BASE_URL" "$APP_ID" "$PROBE_FAVORITE_ID")"
PROBE_FAVORITE_ID=''
REMOVED_TOTAL="$(json_field "$CLEANUP_JSON" afterRemoveCount)"

echo "[ntl:favorites-probe] verify -> favorites restored" >&2
pw open "${BASE_URL}/favorites" >/dev/null
pw run-code "async (page) => { await page.waitForTimeout(8000); }" >/dev/null
poll_favorites_removed "$ADDED_TITLE" "$REMOVED_TOTAL" >/dev/null

cat <<EOF
{
  "baseUrl": "$(printf '%s' "$BASE_URL")",
  "session": "$(printf '%s' "$SESSION")",
  "query": "$(printf '%s' "$SEARCH_QUERY")",
  "appId": "$(printf '%s' "$APP_ID")",
  "baselineTotal": ${BASELINE_TOTAL},
  "addedTitle": "$(printf '%s' "$ADDED_TITLE" | sed 's/"/\\"/g')",
  "favoriteId": "$(printf '%s' "$(json_field "$PREPARE_JSON" favoriteId)")",
  "deepLink": "$(printf '%s' "$DEEP_LINK" | sed 's/"/\\"/g')",
  "afterAddTotal": ${ADDED_TOTAL},
  "afterRemoveTotal": ${REMOVED_TOTAL},
  "verified": {
    "firestoreWrite": true,
    "visibleInFavorites": true,
    "favoritesLinkClickThrough": true,
    "comparePageReachable": true,
    "firestoreCleanup": true,
    "restoredBaselineCount": true
  }
}
EOF
