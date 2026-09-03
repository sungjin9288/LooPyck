# Netlify Deploy Guide

LooPyck uses **Netlify** as the primary free-tier deployment target while Vercel is blocked by fair-use limits.

## 1. Prerequisites

- Node.js 20+
- npm 10+
- Netlify account
- One of:
  - `npx netlify login`
  - `NETLIFY_AUTH_TOKEN`

## 2. Local Project State

This repo is configured for Next.js App Router and Netlify detects it automatically.

Key files:
- `netlify.toml`
- `package.json` scripts:
  - `npm run ntl:status`
  - `npm run ntl:login`
  - `npm run ntl:link`
  - `npm run ntl:sync-env`
  - `npm run ntl:smoke`
  - `npm run ntl:admin-smoke`
  - `npm run ntl:admin-browser-smoke`
  - `npm run ntl:deploy:preview`
  - `npm run ntl:deploy:prod`

## 3. Authenticate

```bash
npm run ntl:login
```

If browser OAuth is not available, set:

```bash
export NETLIFY_AUTH_TOKEN=your_token_here
```

## 4. Link or Create a Site

Try linking by Git remote first:

```bash
npm run ntl:link
```

If the site does not exist yet, use:

```bash
npx netlify init
```

## 5. Sync Environment Variables

Netlify Functions inherit runtime env into AWS Lambda, so the deployed env must
stay under the Lambda 4 KB limit. Do not import `.env.local` directly.

Generate the trimmed allowlist file instead:

```bash
npm run ntl:sync-env
npx netlify env:import --replace-existing .netlify.env
```

The sync script intentionally excludes provider-specific leftovers such as
`VERCEL_OIDC_TOKEN` and rewrites `NEXT_PUBLIC_SITE_URL` / `SITE_URL` to
`https://loo-pyck.netlify.app`.

## 6. Preview Deploy

```bash
npm run ntl:deploy:preview
```

This creates a draft deploy URL for testing.

## 7. Production Deploy

```bash
npm run ntl:deploy:prod
```

## 8. Required Environment Variables

Mirror the existing runtime values already used in `.env.local`.

Minimum set:

```text
NAVER_CLIENT_ID
NAVER_CLIENT_SECRET
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
ADMIN_UIDS
NEXT_PUBLIC_SITE_URL
```

Optional but recommended:

```text
GEMINI_API_KEY
CRON_SECRET
NEXT_PUBLIC_FIREBASE_VAPID_KEY
ALERT_TUNING_WEBHOOK_URL
ALERT_TUNING_WEBHOOK_FORMAT
ALERT_TUNING_WEBHOOK_BEARER
```

## 8.1 Firebase Auth Authorized Domains

Netlify production login requires a matching Firebase Auth allowlist entry. In
Firebase Console:

1. Open `Authentication`
2. Open `Settings`
3. Open `Authorized domains`
4. Add every web hostname that serves this app

Minimum production entry:

```text
loo-pyck.netlify.app
```

If you use preview URLs, a custom domain, or alternate staging hosts, add those
hosts too. If this step is missing, Google login fails with
`auth/unauthorized-domain` even when `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` is set correctly.

## 9. Verification

After deploy, verify:

- `/`
- `/admin`
- `/admin/ops`
- `/api/realtime-search`
- representative queries:
  - `남자 후드`
  - `운동용 후드`
  - `러닝 자켓`
  - `트레이닝 팬츠`
  - `와이드 팬츠`

Reusable smoke check:

```bash
npm run ntl:uat
npm run ntl:deployment-provenance
npm run ntl:smoke
npm run ntl:admin-smoke
npm run ntl:browser-smoke
npm run ntl:admin-browser-smoke
npm run ntl:search-quality-report
npm run ntl:direct-source-smoke
npm run ntl:quick-pass:runtime-ready
npm run ntl:release-closeout
npm run ntl:release-report

# 현재 dirty working tree의 local pre-release evidence
bash scripts/netlifyReleaseQaSmoke.sh http://localhost:3100 \
  > output/playwright/local-release-qa-summary.json
```

Notes:
- `npm run build` generates `public/deployment-provenance.json` from Netlify `COMMIT_REF` / `CONTEXT` / `DEPLOY_ID` without including secrets. The generated file is ignored by Git and belongs to the build output. Hosted identity requires `NETLIFY=true`, GitHub Actions requires `GITHUB_ACTIONS=true`, and `netlify.toml` supplies the repo-owned `LOOPYCK_NETLIFY_BUILD=true` marker only while the local Netlify CLI executes the build command. Metadata names alone cannot claim a provider, conflicting signals fail closed, and commit/branch/context are read only from the selected provider namespace. Hosted builds record `buildEnvironment=netlify-hosted` and a real `deployId`; Netlify CLI builds record `buildEnvironment=netlify-cli` and normalize its `DEPLOY_ID=0` placeholder to `null` while retaining the full commit. GitHub Actions records `GITHUB_RUN_ID` as a separate `runId`, never as a deployment ID. Public manifest validation uses an exact 11-field allowlist; unexpected keys fail validation and diagnostics record only the key name, not its value.
- `ntl:deployment-provenance` compares the deployed static manifest with the expected Git HEAD and writes `output/playwright/{netlify,local}-deployment-provenance.json`, including diagnostics on failure.
- `npm run build` runs `prepareStandaloneRuntime.mjs` after `next build` so `public/` and `.next/static/` are copied into `.next/standalone/`; `npm start`, `ntl:system-stress`, and CI Playwright all use `startStandalone.mjs`. Missing server/assets or an invalid port fail before the runtime starts.
- `ntl:system-stress` starts the local standalone production build and validates the served manifest against the runner commit, dirty state, workspace fingerprint, and GitHub Actions run ID before sending any stress requests. The artifact records only the runner environment and run ID, not arbitrary environment values. A missing, malformed, hosted-only, stale-run, cross-environment, or otherwise mismatched manifest writes a failed `local-system-stress-smoke.json` and stops before the 100-request run.
- GitHub Actions `build-output` always uploads `.next/` together with `public/deployment-provenance.json`. The CI self-audit enforces this exact two-path set so a restored build does not silently lose the provenance gate and does not include unrelated files.
- GitHub Actions build job은 `npm run verify:dependency-audit`를 `|| true` 없이 build 전에 실행한다. policy는 root full graph, `--omit=dev` production install graph, 별도 lockfile의 `tools/capacitor-assets` optional tool graph에 각각 독립 baseline을 적용한다. production baseline은 allowed advisory 0개와 `0 high / 0 critical` ceiling을 강제하며, root/tool baseline에 reviewed debt가 있어도 runtime severe advisory를 허용하지 않는다. 세 schema v2 baseline의 `reviewBy`는 각각 `reviewedAt`로부터 최대 31일로 제한해 미래 날짜·만료 상태를 fail-close한다. `output/playwright/dependency-audit-policy.json`은 scope별 cwd, baseline path, review metadata, workspace fingerprint를 함께 기록하고 성공/실패 모두 upload한다. tool 격리나 baseline 등록은 해결/안전 판정이 아니므로, 해당 scope의 현재 audit chain을 재검토한 후에만 갱신한다.
- Netlify의 read-only build metadata contract는 [official build environment variables documentation](https://docs.netlify.com/build/configure-builds/environment-variables/)을 기준으로 한다. 로컬 검증은 `npx netlify build --context production`으로 수행한다.
- `ntl:uat` is the default release gate. It runs deployment provenance, API smoke, admin API smoke, public browser smoke, and authenticated admin browser smoke in sequence, then writes `output/playwright/netlify-uat-summary.json`.
- `ntl:browser-smoke` validates public search repeat-flow and the unauthenticated `/admin` gate.
- `ntl:admin-smoke` mints a Firebase custom token for the first `ADMIN_UIDS` entry and validates `/api/admin/access` plus `/api/realtime-search/diagnostics`.
- `ntl:admin-browser-smoke` uses the same custom token flow to sign into the browser session and verifies the authenticated `/admin` terminal surface headings, `Admin runtime telemetry` debug console, visible batch action buttons, and both advanced chain toggles.
- `ntl:search-quality-report` requests up to 120 recent search/interaction samples, excludes query/product/admin identity and alert data, then writes target-aware observation artifacts under `output/playwright/{netlify,local}-search-quality-observation-report.{json,md}`. Badge uplift is directional only and remains `HOLD` until each cohort and the no-badge baseline meet the internal sample floor.
- `ntl:direct-source-smoke` requests `/api/realtime-search?debug=1`, requires SSF·Handsome·EQL·LF몰 direct hits, and writes `output/playwright/{local,netlify}-direct-source-integration-smoke.json`. 로컬 artifact는 runner workspace fingerprint를 포함하며 `ntl:release-report`가 current/stale 여부를 판정한다. 로컬 검증은 `npm run ntl:direct-source-smoke -- http://localhost:3100`으로 실행한다.
- Direct source contract는 `lib/api/searchSourceRegistry.ts`의 `ACTIVE_DIRECT_SOURCE_ORDER`가 기준이다. 2026-07-15 live probe에서 SSF `/search/result`, EQL `/public/search/view`, Handsome `/api/goods/1/ko/search/v2/product`, LF몰 `nxapi.lfmall.co.kr/exhibition/search/v1`은 각각 10건 수확을 확인했다. Zigzag(client-only HTML), Farfetch(403/429), S.I.VILLAGE(폐기 도메인 redirect)는 direct 배선에서 제외하며 NAVER classified fallback은 유지한다.
- 외부 쇼핑몰 URL을 변경할 때는 HTTP 200만으로 복구를 판정하지 않고, parser가 유효한 제품 title/price/link/image를 수확하는지 live probe한 다음 registry를 활성화한다.
- After `ntl:uat`, run the visual compare funnel pass described in [PLAYWRIGHT_MCP_UAT.md](/Users/sungjin/dev/personal/LooPyck/docs/PLAYWRIGHT_MCP_UAT.md).
- `ntl:quick-pass:runtime-ready` is the final operational check for the Playwright MCP layer. It regenerates the runtime packet, runs the readiness assertion, and writes `output/playwright/playwright-mcp-runtime-ready.json`.
- `ntl:release-closeout` runs `ntl:uat`, `ntl:quick-pass:runtime-ready`, and `ntl:release-report` in fixed order as the standard release closeout path. It continues after failures so diagnostics are not lost, records each exit code/duration in `output/playwright/netlify-release-closeout-execution.json`, and returns non-zero if any step failed.
- `ntl:release-report` refreshes MCP health, the runtime cleanup plan, and a forced dry-run cleanup result, then builds a human-readable summary from `netlify-uat-summary.json`, `playwright-mcp-runtime-ready.json`, and the refreshed MCP evidence. It writes `output/playwright/release-closeout-report.md`. If cleanup was executed immediately before report generation, the execution audit is preserved as `output/playwright/playwright-mcp-runtime-cleanup-last-execution.json`.
- `netlify-release-qa-summary.json`은 target deployment 동작을, `local-release-qa-summary.json`은 기록된 workspace fingerprint의 pre-release 동작을 증명한다. production UAT의 runner Git HEAD를 deployed commit으로 간주하지 않으며, promotion은 standalone provenance smoke·UAT summary·UAT step parsed payload가 동일한 정적 manifest identity, current HEAD, target URL을 가리키고 5-step UAT가 통과할 때만 완료로 판정한다. 과거 UAT packet과 현재 manifest를 섞은 evidence는 차단한다.
- `netlifyReleaseQaSmoke.sh`는 browser flow 전에 같은 target의 deployment provenance smoke를 blocking 실행하고 결과를 QA summary에 내장한다. local/deployed behavior와 demo screenshot은 summary 내 manifest·commit·target·runner linkage가 유효할 때만 release evidence로 통과한다.

## 10. Mobile Real-Device Testing

Capacitor loads the Netlify production app inside a native WebView. For device QA, use the production scripts:

```bash
npm run cap:doctor
npm run cap:build:prod
npm run cap:ios:prod
# or
npm run cap:android:prod
```

Detailed guide:
- [MOBILE_DEVICE_TESTING.md](/Users/sungjin/dev/personal/LooPyck/docs/MOBILE_DEVICE_TESTING.md)

## 11. Current Hosting Policy

- `Netlify`: primary free-tier deployment path
- `Vercel`: fallback once fair-use restriction clears
- `Cloudflare Workers Free`: currently blocked by Worker size limit
