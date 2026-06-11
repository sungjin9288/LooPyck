#!/usr/bin/env bash
set -euo pipefail

COMMAND="${1:-help}"
BASE_URL="${2:-${SMOKE_BASE_URL:-https://loo-pyck.netlify.app}}"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
SESSION="${PLAYWRIGHT_CLI_SESSION:-real-account-qa}"
EXPECT_ADMIN="${REAL_ACCOUNT_EXPECT_ADMIN:-0}"
SEARCH_QUERY='남자 후드'
WORKDIR="$(pwd)"
OUTPUT_DIR="$WORKDIR/output/playwright"
OUTPUT_PATH="$OUTPUT_DIR/netlify-real-account-qa-summary.json"
PROFILE_DIR="$OUTPUT_DIR/real-account-profile"

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

take_screenshot() {
  local file_name="$1"
  local full_path="$OUTPUT_DIR/$file_name"
  mkdir -p "$OUTPUT_DIR"
  pw run-code "await page.screenshot({ path: ${full_path@Q}, fullPage: true });" >/dev/null
  printf '%s' "$full_path"
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

poll_auth_state() {
  local attempts=0
  while [ "$attempts" -lt 20 ]; do
    local payload
    payload="$(eval_result "() => {
      const body = document.body.innerText || '';
      const hasProfileAvatar = Boolean(document.querySelector('img[alt=\"Profile\"]'));
      const hasLoginButton = Array.from(document.querySelectorAll('button')).some((el) => (el.textContent || '').includes('로그인'));
      return {
        url: window.location.href,
        hasProfileAvatar,
        hasLoginButton,
        bodySnippet: body.replace(/\\s+/g, ' ').slice(0, 240),
      };
    }")"
    local has_avatar
    has_avatar="$(json_field "$payload" hasProfileAvatar)"
    local has_login
    has_login="$(json_field "$payload" hasLoginButton)"
    if [ "$has_avatar" = "true" ] && [ "$has_login" = "false" ]; then
      printf '%s' "$payload"
      return 0
    fi
    sleep 2
    attempts=$((attempts + 1))
  done

  echo "Timed out waiting for real-account auth state" >&2
  return 1
}

poll_profile_menu() {
  local attempts=0
  while [ "$attempts" -lt 10 ]; do
    local payload
    payload="$(eval_result "() => {
      const body = document.body.innerText || '';
      return {
        hasSignOut: body.includes('Sign Out'),
      };
    }")"
    if [ "$(json_field "$payload" hasSignOut)" = "true" ]; then
      printf '%s' "$payload"
      return 0
    fi
    sleep 1
    attempts=$((attempts + 1))
  done

  echo "Timed out waiting for profile menu" >&2
  return 1
}

poll_search_state() {
  local attempts=0
  while [ "$attempts" -lt 20 ]; do
    local payload
    payload="$(eval_result "() => {
      const body = document.body.innerText || '';
      const totalMatch = body.match(/총\\s*(\\d+)개 아이템/);
      const input = document.querySelector('input[placeholder*=\"찾고 싶은 옷을 검색하세요\"]');
      return {
        url: window.location.href,
        hasResults: Boolean(totalMatch && Number(totalMatch[1]) > 0),
        displayedCount: totalMatch ? Number(totalMatch[1]) : 0,
        inputValue: input?.value || '',
        loading: body.includes('검색 결과를 불러오는 중입니다'),
      };
    }")"
    local has_results
    has_results="$(json_field "$payload" hasResults)"
    local input_value
    input_value="$(json_field "$payload" inputValue)"
    local loading
    loading="$(json_field "$payload" loading)"
    if [ "$has_results" = "true" ] && [ "$loading" = "false" ] && [ "$input_value" = "$SEARCH_QUERY" ]; then
      printf '%s' "$payload"
      return 0
    fi
    sleep 2
    attempts=$((attempts + 1))
  done

  echo "Timed out waiting for search route" >&2
  return 1
}

poll_detail_state() {
  local attempts=0
  while [ "$attempts" -lt 20 ]; do
    local payload
    payload="$(eval_result "() => {
      const body = document.body.innerText || '';
      return {
        url: window.location.href,
        hasCompareIntro: body.includes('고정 compare page입니다.'),
        hasMallCompare: body.includes('선택 variant 기준 쇼핑몰 비교'),
        hasPriceHistory: body.includes('선택 variant 가격 흐름'),
        hasDecisionBlock: body.includes('사이즈') || body.includes('배송 정책') || body.includes('핏 가이드'),
      };
    }")"
    if [ "$(json_field "$payload" hasCompareIntro)" = "true" ] \
      && [ "$(json_field "$payload" hasMallCompare)" = "true" ] \
      && [ "$(json_field "$payload" hasPriceHistory)" = "true" ]; then
      printf '%s' "$payload"
      return 0
    fi
    sleep 2
    attempts=$((attempts + 1))
  done

  echo "Timed out waiting for detail compare page" >&2
  return 1
}

poll_favorites_state() {
  local attempts=0
  while [ "$attempts" -lt 20 ]; do
    local payload
    payload="$(eval_result "() => {
      const body = document.body.innerText || '';
      return {
        url: window.location.href,
        hasLookbook: body.includes('My Lookbook'),
        hasSavedSummary: /saved/i.test(body),
        hasCompareReady: body.includes('Compare Ready'),
        hasEmptyState: body.includes('찜한 상품이 없습니다'),
        hasFavoritesSummary: body.includes('전체 저장 항목'),
      };
    }")"
    if [ "$(json_field "$payload" hasLookbook)" = "true" ] \
      && [ "$(json_field "$payload" hasSavedSummary)" = "true" ] \
      && { [ "$(json_field "$payload" hasEmptyState)" = "true" ] || [ "$(json_field "$payload" hasFavoritesSummary)" = "true" ]; }; then
      printf '%s' "$payload"
      return 0
    fi
    sleep 2
    attempts=$((attempts + 1))
  done

  echo "Timed out waiting for favorites page" >&2
  return 1
}

poll_admin_state() {
  local attempts=0
  while [ "$attempts" -lt 20 ]; do
    local payload
    payload="$(eval_result "() => {
      const body = document.body.innerText || '';
      const url = window.location.href;
      return {
        checked: true,
        expectedAdmin: true,
        url,
        hasTerminal: body.includes('Search Learning Terminal Overview'),
        hasQueueActions: body.includes('pending 전체 선택') || body.includes('선택 AI 제안'),
        hasAdvancedToggle: body.includes('Advanced Chain 펼치기') || body.includes('Advanced Chain 접기'),
        gated: body.includes('Sign In Required') || body.includes('관리자 진단 화면을 보려면 먼저 로그인'),
        redirectedHome: url === ${BASE_URL@Q} || url === ${BASE_URL@Q} + '/',
      };
    }")"
    if [ "$(json_field "$payload" hasTerminal)" = "true" ] \
      || [ "$(json_field "$payload" gated)" = "true" ] \
      || [ "$(json_field "$payload" redirectedHome)" = "true" ]; then
      printf '%s' "$payload"
      return 0
    fi
    sleep 2
    attempts=$((attempts + 1))
  done

  echo "Timed out waiting for admin page" >&2
  return 1
}

print_usage() {
  cat <<EOF
{
  "session": "$(printf '%s' "$SESSION")",
  "baseUrl": "$(printf '%s' "$BASE_URL")",
  "commands": {
    "start": "Open a headed browser session for manual Google sign-in.",
    "verify": "Verify the logged-in real-account QA surfaces and write a summary artifact.",
    "close": "Close the real-account QA browser session."
  },
  "examples": [
    "npm run ntl:real-account-qa:start",
    "npm run ntl:real-account-qa:verify",
    "REAL_ACCOUNT_EXPECT_ADMIN=1 npm run ntl:real-account-qa:verify",
    "npm run ntl:real-account-qa:close"
  ]
}
EOF
}

start_session() {
  mkdir -p "$PROFILE_DIR"
  cat <<EOF >&2
[ntl:real-account-qa:start]
- headed browser session을 이 터미널에 붙여서 엽니다.
- Google sign-in을 완료하고 홈 헤더에서 프로필 아바타를 확인하세요.
- sign-in 후에는 headed browser window를 직접 닫고,
  \`npm run ntl:real-account-qa:verify\` 로 같은 profile을 headless 검증하세요.
EOF
  PLAYWRIGHT_CLI_SESSION="$SESSION" CODEX_HOME="$CODEX_HOME" "$PWCLI" open --headed --profile "$PROFILE_DIR" "$BASE_URL/"
}

verify_session() {
  mkdir -p "$OUTPUT_DIR"
  PLAYWRIGHT_CLI_SESSION="$SESSION" CODEX_HOME="$CODEX_HOME" "$PWCLI" open --profile "$PROFILE_DIR" "$BASE_URL/" >/dev/null

  if ! pw goto "$BASE_URL/" >/dev/null 2>&1; then
    echo "Playwright session \"$SESSION\" is not ready for navigation. Run \`npm run ntl:real-account-qa:start\`, complete Google sign-in, then retry verify." >&2
    return 1
  fi

  local auth_state
  auth_state="$(poll_auth_state)"

  local opened_profile
  opened_profile="$(eval_result "() => {
    const button = document.querySelector('img[alt=\"Profile\"]')?.closest('button');
    if (!button) return false;
    button.click();
    return true;
  }")"

  local profile_menu
  profile_menu="$(poll_profile_menu)"
  local home_screenshot
  home_screenshot="$(take_screenshot 'real-account-home.png')"

  pw goto "${BASE_URL}/?q=$(node -e "process.stdout.write(encodeURIComponent(process.argv[1]));" "$SEARCH_QUERY")&sort=sim" >/dev/null
  local search_state
  search_state="$(poll_search_state)"

  local detail_product
  detail_product="$(resolve_detail_product "$SEARCH_QUERY")"
  local detail_href
  detail_href="$(json_field "$detail_product" href)"
  local detail_title
  detail_title="$(json_field "$detail_product" title)"
  pw goto "$detail_href" >/dev/null
  local detail_state
  detail_state="$(poll_detail_state)"
  local detail_screenshot
  detail_screenshot="$(take_screenshot 'real-account-detail.png')"

  pw goto "${BASE_URL}/favorites" >/dev/null
  local favorites_state
  favorites_state="$(poll_favorites_state)"
  local favorites_screenshot
  favorites_screenshot="$(take_screenshot 'real-account-favorites.png')"

  local admin_state
  admin_state="$(node -e "
    process.stdout.write(JSON.stringify({
      checked: false,
      expectedAdmin: ['1', 'true', 'yes'].includes((process.argv[1] || '').toLowerCase()),
      status: 'skipped',
    }));
  " "$EXPECT_ADMIN")"
  local admin_screenshot=''

  if node -e "process.exit(['1', 'true', 'yes'].includes((process.argv[1] || '').toLowerCase()) ? 0 : 1)" "$EXPECT_ADMIN"; then
    pw goto "${BASE_URL}/admin" >/dev/null
    admin_state="$(poll_admin_state)"
    if [ "$(json_field "$admin_state" hasTerminal)" != "true" ]; then
      echo "REAL_ACCOUNT_EXPECT_ADMIN=1 but /admin did not reach the terminal surface: $admin_state" >&2
      return 1
    fi
    admin_state="$(node -e "
      const data = JSON.parse(process.argv[1]);
      data.status = 'terminal';
      process.stdout.write(JSON.stringify(data));
    " "$admin_state")"
    admin_screenshot="$(take_screenshot 'real-account-admin.png')"
  fi

  node -e "
    const fs = require('fs');
    const outputPath = process.argv[1];
    const baseUrl = process.argv[2];
    const session = process.argv[3];
    const searchQuery = process.argv[4];
    const authState = JSON.parse(process.argv[5]);
    const openedProfile = process.argv[6] === 'true';
    const profileMenu = JSON.parse(process.argv[7]);
    const searchState = JSON.parse(process.argv[8]);
    const detailProduct = JSON.parse(process.argv[9]);
    const detailState = JSON.parse(process.argv[10]);
    const detailScreenshot = process.argv[11];
    const favoritesState = JSON.parse(process.argv[12]);
    const favoritesScreenshot = process.argv[13];
    const adminState = JSON.parse(process.argv[14]);
    const adminScreenshot = process.argv[15] || null;
    const homeScreenshot = process.argv[16];

    const summary = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      session,
      authState: {
        ...authState,
        profileMenuOpened: openedProfile,
        hasSignOut: Boolean(profileMenu.hasSignOut),
      },
      search: {
        query: searchQuery,
        ...searchState,
      },
      detail: {
        title: detailProduct.title,
        href: detailProduct.href,
        screenshot: detailScreenshot,
        ...detailState,
      },
      favorites: {
        screenshot: favoritesScreenshot,
        ...favoritesState,
      },
      admin: {
        ...adminState,
        screenshot: adminScreenshot,
      },
      screenshots: {
        home: homeScreenshot,
        detail: detailScreenshot,
        favorites: favoritesScreenshot,
        admin: adminScreenshot,
      },
    };

    fs.mkdirSync(require('node:path').dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
    process.stdout.write(JSON.stringify({ ...summary, outputPath }, null, 2));
  " \
    "$OUTPUT_PATH" \
    "$BASE_URL" \
    "$SESSION" \
    "$SEARCH_QUERY" \
    "$auth_state" \
    "$opened_profile" \
    "$profile_menu" \
    "$search_state" \
    "$detail_product" \
    "$detail_state" \
    "$detail_screenshot" \
    "$favorites_state" \
    "$favorites_screenshot" \
    "$admin_state" \
    "$admin_screenshot" \
    "$home_screenshot"

}

close_session() {
  cat <<EOF
Close the headed real-account browser window manually, then run \`npm run ntl:real-account-qa:verify\`.
EOF
}

case "$COMMAND" in
  start)
    start_session
    ;;
  verify)
    verify_session
    ;;
  close)
    close_session
    ;;
  *)
    print_usage
    ;;
esac
