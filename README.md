# LooPyck (루픽)

<div align="center">

![LooPyck Logo](./public/icons/icon-512x512.png)

**AI-Powered Fashion Price Comparison Platform**

> 여러 쇼핑몰 검색 · 가격 비교 · AI 추천을 하나의 흐름으로 묶은 패션 가격 비교 웹앱 (MVP)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-orange?logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

[Demo](https://loo-pyck.netlify.app) • [Docs](./docs/) • [Changelog](./docs/CHANGELOG.md) • [Issues](https://github.com/sungjin9288/LooPyck/issues)

</div>

---

## 🎯 Overview

> **"Look & Pick"** — AI로 주요 쇼핑몰 가격을 한눈에 비교하세요.

LooPyck은 무료 티어 인프라(Netlify · Firebase) 위에서 네이버 쇼핑 API, 무신사, 29CM 상품 정보를 실시간 수집하고,  
**쇼핑몰 간 가격 비교 + AI 스타일 추천**을 제공하는 패션 가격 비교 웹앱(MVP)입니다.

---

## 🚀 주요 기능

### 핵심 비교 기능
| Feature | Description |
|---------|-------------|
| 🏷️ **멀티 쇼핑몰 가격 비교** | 동일 상품을 쇼핑몰별로 자동 묶어 최저가/최고가 한눈 비교 |
| 📊 **가격 추이 차트** | 6개월 가격 변화 추이 그래프 |
| 🔍 **통합 실시간 검색** | 네이버 쇼핑 API + 무신사 + 29CM 동시 검색 |
| 🎯 **FilterPanel** | 가격대 / 쇼핑몰 / 브랜드 3단계 필터링 |

### UX & 개인화
| Feature | Description |
|---------|-------------|
| 🕐 **최근 본 상품** | localStorage 기반 최근 20개 상품 히스토리 |
| 📚 **My Lookbook** | 찜 상품을 컬렉션으로 분류·관리 |
| 🔥 **트렌드 키워드** | 이번 주 인기 키워드 원클릭 검색 |
| 📱 **스와이프 모달** | 모바일에서 상품 상세 스와이프-다운 닫기 |

### AI 기능
| Feature | Description |
|---------|-------------|
| 🧠 **MoodEngine** | 자연어 쿼리 자동 확장 ("올드머니룩" → 세부 키워드) |
| 💬 **StyleChat** | AI 스타일 상담 챗봇 |
| 🎨 **Visual Search** | 이미지로 유사 상품 검색 (MobileNet) |
| 📅 **Trend Discovery** | 월간 트렌드 키워드 자동 갱신 |

### Admin & Ops
| Feature | Description |
|---------|-------------|
| 🛠️ **Admin Debug Console** | `/admin`, `/admin/ops`에서 diagnostics polling latency, fetch failure streak, storage fallback 상태를 지속적으로 확인 |
| 🚨 **Alert Ops Control Tower** | approval queue, audit inbox, rollout tuning, webhook reminder 운영 상태를 한 화면에서 추적 |

### SEO & 플랫폼
| Feature | Description |
|---------|-------------|
| 🌐 **카테고리 페이지** | `/category/outer`, `/category/denim` 등 SEO 최적화 랜딩 |
| 🏪 **브랜드 페이지** | `/brand/musinsa`, `/brand/ably` 등 브랜드별 SEO 랜딩 |
| ⚡ **Error Boundary** | Next.js `error.tsx` 기반 화이트스크린 방지 |

### 지원 쇼핑몰

| 쇼핑몰 | 연동 방식 | 상태 |
|--------|-----------|------|
| 네이버 쇼핑 API | Open API | ✅ |
| 무신사 | 실시간 스크래핑 | ✅ |
| 29CM | 검색 API | ✅ |
| SSF SHOP | 공식 검색 HTML adapter | ✅ |
| 더한섬닷컴 | 공식 web search API adapter | ✅ |
| EQL | 공식 검색 HTML adapter | ✅ |
| LF몰 | 공식 web search API adapter | ✅ |

Direct adapter가 client-only rendering, bot protection, 도메인 이전으로 안정적으로 수집되지 않는 쇼핑몰은 실행 registry에서 제외하고, Naver Shopping 결과의 mall/domain 분류를 fallback으로 사용합니다. 따라서 모든 쇼핑몰의 direct 수집을 보장하지 않습니다.

---

## 🛠 기술 스택

```
Frontend:   Next.js 16.x, React 18.3.1, TypeScript, Tailwind CSS, Framer Motion
AI:         Gemini 2.5 Flash (Vision + Text)
Auth:       Firebase Authentication (Anonymous + Google OAuth)
Database:   Cloud Firestore
Hosting:    Netlify (Primary), Cloudflare Workers (OpenNext), Vercel (Fallback / limited)
CI/CD:      GitHub Actions
```

---

## 🧭 Project Structure

```text
LooPyck/
├─ app/                         # Next.js App Router
│  ├─ api/
│  │  ├─ search/route.ts
│  │  └─ realtime-search/route.ts
│  ├─ category/[slug]/page.tsx  # 카테고리 SEO 랜딩 페이지
│  ├─ brand/[slug]/page.tsx     # 브랜드 SEO 랜딩 페이지
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ error.tsx                 # Error Boundary
│  └─ globals.css
│
├─ components/
│  ├─ home/TrendDiscovery.tsx
│  ├─ search/                   # SearchBar, FilterPanel, RecentSearches
│  ├─ product/                  # ProductCard, InfiniteProductGrid, ProductDetailModal
│  │                            # RecentlyViewedSection, PriceHistoryChart
│  ├─ favorites/FavoritesPage.tsx  # My Lookbook 컬렉션
│  ├─ layout/                   # Navbar (scroll-aware), MobileBottomNav
│  └─ shared/
│
├─ hooks/
│  ├─ useCloudStorage.ts        # Firestore 찜 동기화
│  ├─ useMultiSourceSearch.ts   # 멀티소스 통합 검색
│  ├─ useGroupedProducts.ts     # 동일 상품 그룹화
│  └─ useRecentlyViewed.ts      # 최근 본 상품
│
├─ lib/
│  ├─ api/                      # realtimeAggregator, types (GroupedProduct)
│  ├─ ai/                       # moodEngine, visionParser, geminiProvider
│  ├─ trends/                   # monthlyTrendAnalyzer
│  ├─ security/                 # requestGuards, urlSafety
│  └─ core/                     # domainGuard, dataNormalizer
│
├─ types/
│  └─ product.ts
├─ utils/
├─ public/
├─ tailwind.config.ts
├─ firebase.json
├─ firestore.indexes.json
└─ firestore.rules
```

---

## 📦 Quick Start

```bash
# 1. Clone
git clone https://github.com/sungjin9288/LooPyck.git
cd LooPyck

# 2. Install
npm install

# 3. Configure
cp .env.local.example .env.local
# .env.local에 API 키 입력

# 4. Run
npm run dev

# Fixed local port
# http://localhost:3000

# Production standalone runtime
npm run build
npm start

# 5. Type Check
npm run typecheck

# 6. Env Validation
npm run env:check

# 7. Firebase Rules / Indexes Deploy
firebase deploy --only firestore:rules,firestore:indexes

# 8. Cloudflare local preview
npm run cf:preview
```

### 환경 변수

| Variable | Required | Description |
|----------|----------|-------------|
| `NAVER_CLIENT_ID` | ✅ | 네이버 쇼핑 검색 API Client ID |
| `NAVER_CLIENT_SECRET` | ✅ | 네이버 쇼핑 검색 API Client Secret |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ | Firebase App ID |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | ✅(푸시 사용 시) | Web Push VAPID 공개 키 |
| `NEXT_PUBLIC_SITE_URL` | 권장 | canonical/share/sitemap 기준 사이트 URL |
| `SITE_URL` | 선택 | 서버 전용 사이트 URL override |
| `NEXT_PUBLIC_SITE_NAME` | 선택 | 사이트명 override |
| `GEMINI_API_KEY` | 선택 | AI 분석 기능용 Gemini API Key (서버 전용) |
| `FIREBASE_ADMIN_PROJECT_ID` | ✅(운영) | Firebase Admin SDK Project ID (가격 이력/알림 배치) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | ✅(운영) | Firebase Admin SDK Client Email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | ✅(운영) | Firebase Admin SDK Private Key (`\n` 이스케이프 필요) |
| `ADMIN_UIDS` | ✅(`/admin` 사용 시) | Admin API 접근 UID 목록(쉼표 구분) |
| `CRON_SECRET` | ✅(운영) | `/api/jobs/scan-price-alerts` 보호용 시크릿 |
| `ALERT_TUNING_WEBHOOK_URL` | 선택 | approval reminder digest를 보낼 external ops webhook URL |
| `ALERT_TUNING_WEBHOOK_FORMAT` | 선택 | `generic`, `slack`, `discord` 중 webhook payload format (미입력 시 URL 기반 auto-detect) |
| `ALERT_TUNING_WEBHOOK_BEARER` | 선택 | 위 webhook 호출 시 붙일 Bearer token |
| `CAPACITOR_APP_ID` | 선택 | Capacitor 네이티브 앱 식별자 |
| `CAPACITOR_APP_NAME` | 선택 | Capacitor 앱 이름 |
| `CAPACITOR_SERVER_URL` | 선택 | Capacitor가 로드할 원격 웹앱 URL |
| `IOS_TEAM_ID` | ✅(iOS 배포 시) | Apple Team ID (`ABCDE12345`) |
| `IOS_BUNDLE_ID` | ✅(iOS 배포 시) | 앱 Bundle ID (`com.company.app`) |
| `IOS_APPCLIP_BUNDLE_ID` | 선택 | App Clip Bundle ID |
| `NEXT_PUBLIC_ADMIN_UIDS` | 선택(레거시) | 클라이언트 fallback용 공개 UID 목록 |
| `UPSTASH_REDIS_REST_URL` | 선택 | 분산 Rate Limit용 Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | 선택 | 분산 Rate Limit용 Upstash Redis Token |

### Netlify Deploy

Netlify is the primary free-tier deployment target while Vercel is blocked.

```bash
# authenticate
npm run ntl:login

# link existing GitHub repo or create a new site
npm run ntl:link

# sync the trimmed runtime env before deploy
npm run ntl:sync-env
npx netlify env:import --replace-existing .netlify.env

# preview deploy
npm run ntl:deploy:preview

# production deploy
npm run ntl:deploy:prod

# smoke check
npm run ntl:smoke
npm run ntl:admin-smoke

# browser smoke check
npm run ntl:uat
npm run ntl:browser-smoke
npm run ntl:admin-browser-smoke
npm run ntl:quick-pass:runtime-ready
npm run ntl:release-closeout
npm run ntl:release-report

# source/compare/badge cohort 품질을 production-safe snapshot으로 관찰
npm run ntl:search-quality-report

# 현재 working tree를 local admin API 기준으로 관찰
npm run ntl:search-quality-report -- http://localhost:3100

# dirty working tree의 pre-release 동작을 production UAT와 별도 검증
RELEASE_QA_SCREENSHOTS=1 bash scripts/netlifyReleaseQaSmoke.sh http://localhost:3100 \
  > output/playwright/local-release-qa-summary.json
```

`ntl:uat` is the default Netlify release gate and writes `output/playwright/netlify-uat-summary.json`.
`ntl:admin-browser-smoke` verifies the authenticated Netlify `/admin` terminal headings,
visible queue/draft action buttons, and both advanced chain toggles.
`ntl:quick-pass:runtime-ready` is the Playwright MCP closeout command and writes
`output/playwright/playwright-mcp-runtime-ready.json`. A `fallback-ready` result means the
built-in MCP is still degraded, but the repo-local fallback and escalation packet are ready.
`ntl:release-closeout` runs UAT, runtime-ready, and release-report in sequence for the standard release closeout path.
`ntl:release-report` refreshes MCP health, the runtime cleanup plan, and a forced dry-run
cleanup result, then converts the latest UAT summary, runtime-ready artifact, and refreshed MCP evidence into
`output/playwright/release-closeout-report.md`. If cleanup was executed immediately before
report generation, the last execution result is preserved separately as
`output/playwright/playwright-mcp-runtime-cleanup-last-execution.json`. The report also evaluates
the local direct-source integration artifact against the current workspace fingerprint, so a
previously successful source probe is reported as stale after code or documentation changes.

Release evidence는 대상을 분리해 해석합니다. Netlify UAT는 현재 배포 환경의 동작을 증명하지만 deployed commit을 자동으로 증명하지 않습니다. dirty working tree는 local release QA artifact의 Git diff/untracked content fingerprint가 현재 workspace와 일치할 때만 pre-release 검증 완료로 표기합니다. `RELEASE_QA_SCREENSHOTS=1`이면 같은 세션에서 home/search/detail/favorites 캡처를 생성하며, closeout report는 네 파일의 존재와 fingerprint 일치를 별도로 확인합니다.

### Compare Entry Review Gate

Compare Entry redesign work uses a `Design+Code` gate: `SUN-10` design review must be
`READY` before `SUN-11` / `SUN-12` implementation is treated as valid.

Current status:

- `SUN-10` gate: `READY`, artifact audit `READY`, active blocker `none`.
- `SUN-11`: landing entry implementation completed against the approved dark Figma direction.
- `SUN-12`: search-result compare hierarchy and shortlist visual continuity completed.
- `SUN-13`: release evidence and QA closure completed.
- Next comparable redesign work should reuse the same order: design gate first, implementation second, release evidence last.

```bash
# refresh the review bundle and confirm the strict gate
npm run ntl:compare-entry-review-ready-check
```

If this command stops exiting `0`, do not reopen implementation scope first. Inspect the
gate artifacts, restore `SUN-10` evidence integrity, and only then touch code. The full
operator manual, including the historical Figma quota unblock path and guarded apply
commands, lives in [docs/COMPARE_ENTRY_REVIEW_GATE.md](./docs/COMPARE_ENTRY_REVIEW_GATE.md).

Detailed guides:
- [docs/NETLIFY_DEPLOY.md](./docs/NETLIFY_DEPLOY.md)
- [docs/COMPARE_ENTRY_FUNNEL_MANUAL_FIGMA_BUILD_CHECKLIST.md](./docs/COMPARE_ENTRY_FUNNEL_MANUAL_FIGMA_BUILD_CHECKLIST.md)
- [docs/COMPARE_ENTRY_FUNNEL_VALIDATION_MATRIX.md](./docs/COMPARE_ENTRY_FUNNEL_VALIDATION_MATRIX.md)
- [docs/PLAYWRIGHT_MCP_UAT.md](./docs/PLAYWRIGHT_MCP_UAT.md)
- [docs/CLOUDFLARE_DEPLOY.md](./docs/CLOUDFLARE_DEPLOY.md) (kept as blocked alternative)
- [docs/MOBILE_DEVICE_TESTING.md](./docs/MOBILE_DEVICE_TESTING.md)

## Testing

2026-09-03 현재 working tree 기준으로 adapter/domain test 526건을 실행해 모두 통과했습니다.
테스트 수와 pass 결과는 아래 명령의 Node.js test runner summary로 확인합니다.

```bash
npm run typecheck
npm run test:adapters  # tests 526, pass 526, fail 0
npm run test:deployment-provenance-contract
npm run test:release-closeout-contract
npm run build
npm run ntl:deployment-provenance -- http://localhost:3100
npm run ntl:direct-source-smoke -- http://localhost:3100
npm run ntl:system-stress
npm run verify:portfolio-claims
npm run verify:ci-workflow
npm run verify:dependency-audit
```

`npm run build` copies `public/` and `.next/static/` into the generated `.next/standalone/`
runtime, and `npm start` launches that packaged server instead of the unsupported
`next start` + `output: standalone` combination.

`ntl:system-stress` starts the same standalone production runtime locally, validates the served
`deployment-provenance.json` against the runner commit, working-tree fingerprint, and GitHub Actions
run identity, and only then sends 100 concurrent requests across four deterministic page/API
validation contracts. It records the secret-free runner identity, linked build manifest, success
rate, p95 latency, and the Next server process-tree RSS delta in
`output/playwright/local-system-stress-smoke.json`. This is a local regression smoke, not a
production concurrent-user capacity claim.

`verify:portfolio-claims` checks current portfolio-facing documents for unsupported outcome/status
claims and requires a fixed evidence marker on retained legacy planning artifacts. The audit is
written to `output/playwright/portfolio-claim-audit.json` and linked to the working-tree fingerprint.

`verify:ci-workflow` prevents the GitHub Actions integrity gates from moving to the wrong job,
becoming non-blocking, or running out of order. The test job audits the current workflow itself and
always uploads both portfolio and CI audit artifacts. The E2E job runs the manifest-linked
100-request production-build stress before Playwright and always uploads the stress artifact. The
build job always packages `.next/` and the generated `public/deployment-provenance.json` together;
the self-audit rejects missing or unexpected build artifact paths.

`verify:dependency-audit` runs root `npm audit --json`, root
`npm audit --omit=dev --json`, and an isolated `tools/capacitor-assets` audit. It compares every
high/critical advisory source, package, severity, and vulnerable-package count against a separate
reviewed baseline for each scope. The production install baseline allows no severe advisory; the
optional asset generator remains exact-version locked and separately audited instead of being
installed with every root dependency setup. A new advisory, severity increase, unresolved dependency
chain, or count increase fails CI; `|| true` is not used. Each baseline schema v2 review window is
independently limited to 31 days, and a future-dated or expired review fails the same gate. Extending
any date requires rerunning that scope's audit and reviewing the current source/package/severity
chains rather than treating a baseline as a permanent exception. The fingerprint-linked result is written to
`output/playwright/dependency-audit-policy.json`. The July remediation history reduced the full graph
and separated the Apps in Toss runtime from build-only tooling, then isolated `@capacitor/assets`
from the default root install. The 2026-09-03 re-review applied only non-breaking lockfile fixes and
kept both direct manifests unchanged. The current verifier reports root `50 total / 15 high / 1
critical`, production install `8 moderate / 0 high / 0 critical`, and the optional asset tool `7
total / 3 high / 1 critical`; all three scopes match baselines reviewed through 2026-10-03. These
values come from `npm run verify:dependency-audit`. Isolation and baseline matching are not
remediation: root build/dev and optional tool debt remain reviewed and visible in their baseline files.
These are npm scope and dependency-package counts, not a claim that the remaining upstream debt is
safe, exploitable in the deployed application, or resolved.

`npm run build` first writes a secret-free `public/deployment-provenance.json` from Netlify,
GitHub Actions, or local Git metadata. The manifest distinguishes hosted Netlify, Netlify CLI,
GitHub Actions, and local builds; the CLI placeholder `DEPLOY_ID=0` is never presented as a real
deploy ID. Netlify hosted builds use `deployId`, GitHub Actions uses a separate `runId`, and
cross-provider identifier combinations fail validation. The public manifest uses an exact field
allowlist; unexpected metadata is rejected without echoing its value into diagnostics. Hosted
identity requires `NETLIFY=true`, GitHub Actions requires `GITHUB_ACTIONS=true`, and the repository's
Netlify build command supplies `LOOPYCK_NETLIFY_BUILD=true` only for local CLI builds. Conflicting
signals fail closed, and each provider reads only its own commit/branch/context namespace. `ntl:uat`
validates that deployed manifest before its API and
browser steps. Promotion additionally requires the standalone smoke, UAT summary, and parsed UAT
step to carry the same manifest identity, expected HEAD, and target URL; a stale or mixed UAT packet
cannot satisfy the gate. The current production
promotion remains unverified until this manifest is deployed and the new five-step UAT is rerun.

`ntl:release-closeout` always executes UAT, Playwright runtime readiness, and release report in that
order. A failed step does not suppress later diagnostics, but the command still exits non-zero and
writes step exit codes and durations to `output/playwright/netlify-release-closeout-execution.json`.

`netlifyReleaseQaSmoke.sh` runs the target provenance check before opening Playwright. Its local or
deployed QA summary embeds that exact provenance result, so behavior and screenshots cannot pass
release evidence evaluation without a valid manifest linked to the same commit, target, and runner.

실행 로그는 로컬 `evidence/cli-logs/test-adapters.log`에 생성하며, API 응답과 사용자 데이터가 섞이지 않도록 Git 추적에서는 제외합니다.

## Admin Diagnostics

관리자 계정으로 로그인한 뒤 아래 화면에서 운영 상태를 확인할 수 있습니다.

- `/admin`: realtime search diagnostics + alert ops + search learning workbench
- `/admin/ops`: alert approval / audit / rollout 중심 운영 콘솔

`Admin Debug Console`은 toast처럼 사라지는 신호가 아니라, 현재 세션 기준으로 아래 상태를 계속 노출합니다.

- diagnostics polling 평균/마지막 지연 시간
- fetch success rate / failure streak
- `memory`, `default`, `unavailable` storage fallback 상태
- 최근 diagnostics polling metric과 fetch error

### Mobile Real-Device Testing

Capacitor is already wired in remote URL mode. For device QA, use the production scripts so the native shell always loads Netlify production.

```bash
npm run cap:doctor
npm run cap:build:prod
npm run cap:ios:prod
# or
npm run cap:android:prod

# icon/splash를 다시 생성할 때만 optional tool을 설치하고 실행
npm run cap:assets:setup
npm run cap:assets
```

These scripts pin the native WebView to:

```text
https://loo-pyck.netlify.app
```

---

## 📊 Performance (설계 목표 · 측정 상태)

아래는 **설계 목표(target)**이며, 신뢰할 수 있는 측정 근거가 확보된 항목만 실측치로 표기합니다.
근거 없는 추출 정확도 · 요청당 API 비용 · 비용 절감률 수치는 표기하지 않습니다.

| Metric | Target | 측정 방법 | 상태 |
|--------|--------|----------|------|
| Lighthouse Score | 90+ | Chrome Lighthouse 실행 | 미측정 (재현 가능) |
| Response Time (p95) | < 3s | 검색 API 호출 로그 집계 | 미측정 |
| Extraction 성공률 | 90%+ | 어댑터 테스트 로그 집계 | 미측정 |

---

## 🔒 Security

- Firebase Auth (Anonymous → Google OAuth 전환)
- Ownership-based Firestore Rules
- Per-IP Rate Limiting (Upstash Redis, fallback: in-memory)
- Query Validation (길이/페이지 바운드 검증)
- Upstream API timeout 보호
- Server-only Gemini key (`GEMINI_API_KEY`, public 미노출)
- XSS & Prompt Injection 패턴 검사

---

## 🗺️ Roadmap

- [x] 멀티 쇼핑몰 실시간 가격 비교
- [x] AI MoodEngine (쿼리 확장)
- [x] My Lookbook 컬렉션
- [x] 쇼핑몰별 가격 비교 테이블
- [x] 가격대/브랜드/소스 FilterPanel
- [x] 최근 본 상품 히스토리
- [x] 카테고리/브랜드 SEO 랜딩 페이지
- [x] 모바일 스와이프-다운 모달
- [x] Error Boundary
- [x] 실제 가격 이력 DB 저장 (`/api/realtime-search` 인입 시 누적)
- [x] 목표가 감지 배치 + 알림 발송 (`/api/jobs/scan-price-alerts`, 30분 크론)
- [ ] AR Try-On Integration
- [ ] Cross-Border 해외 쇼핑몰 확장

---

## 🔭 Scope & Limitations

- 실제 커머스 **결제 기능은 포함하지 않습니다.** 상품 검색 · 비교 · 추천까지가 범위입니다.
- 운영 중인 상용 서비스가 아니라 **MVP / PoC 확장형** 프로젝트입니다.
- 무신사 · 29CM는 공식 API가 아닌 **스크래핑 / 폴백 어댑터** 기반이라, 대상 사이트 구조 변경 시 깨질 수 있습니다.
- 검증되지 않은 비용 절감률 · 추천 정확도 · 자동화율 수치는 사용하지 않습니다.
- 가격 이력 누적과 알림 배치는 동작하지만, 대규모 트래픽 · 데이터 정합성은 추가 검증이 필요합니다.
- dependency audit의 root build/dev graph에는 Apps in Toss upstream chain의 reviewed high/critical debt가 남아 있고, 별도 설치하는 Capacitor asset generator에도 자체 upstream debt가 남아 있습니다. `--omit=dev` production install graph는 2026-09-03 검사에서 high/critical 0건이었지만, 세 scope의 baseline은 신규 악화를 차단하고 최대 31일마다 재검토를 강제할 뿐 package safety나 exploitability를 보장하지 않습니다.
- Capacitor는 Netlify remote URL mode로 검증됐지만 Apps in Toss 출시는 별도 build artifact를 Toss CDN에 업로드하는 구조입니다. 현재 Next standalone/API app은 `ait build`가 요구하는 CSR/SSG `index.html` output을 만들지 않으므로, Apps in Toss artifact 출시는 별도 static mini-app architecture가 필요한 후속 범위입니다.

---

## 📄 License

MIT © 2026 LooPyck. All rights reserved.

---

<div align="center">

**Built with ❤️ and AI**

[Demo](https://loo-pyck.netlify.app) • [Docs](./docs/) • [Changelog](./docs/CHANGELOG.md) • [Issues](https://github.com/sungjin9288/LooPyck/issues)

</div>
