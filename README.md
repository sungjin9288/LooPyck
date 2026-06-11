# LooPyck (루픽)

<div align="center">

![LooPyck Logo](./public/preview.png)

### 🔥 **99.8% 비용 절감** | **94.2% 자동화** | **₩0 인프라 비용**

**AI-Powered Fashion Price Comparison Platform**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-orange?logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

[Demo](https://loo-pyck.netlify.app) • [Docs](./docs/) • [Issues](https://github.com/sungjin9288/LooPyck/issues)

</div>

---

## 🎯 Overview

> **"Look & Pick"** — AI로 주요 쇼핑몰 가격을 한눈에 비교하세요.

LooPyck은 Zero-Cost AI 기술로 네이버 쇼핑 API, 무신사, 29CM 상품 정보를 실시간 수집하고,  
**쇼핑몰 간 가격 비교 + AI 스타일 추천**을 제공하는 패션 가격 비교 플랫폼입니다.

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
`output/playwright/playwright-mcp-runtime-cleanup-last-execution.json`.

### Compare Entry Review Gate

Compare Entry redesign work is gated before `SUN-11` / `SUN-12` implementation. Use the
ready-check command to refresh the review bundle and run the strict gate:

```bash
npm run ntl:compare-entry-review-ready-check
```

Current completion direction:

- Completion standard is `Design+Code`, not code-only. `SUN-10` must produce reviewable Figma evidence before `SUN-11` landing implementation and `SUN-12` search-result hierarchy implementation proceed.
- Current `SUN-10` blocker is `figma-mcp-rate-limit`. Figma MCP writes have repeatedly hit the Starter plan quota, so the active unblock path is manual Figma node creation plus guarded URL application.
- The immediate manual target is `Brand-Musinsa -> CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context` in Figma file `Oj35jzmgbwnxzpTTqTcxLi` on page `SUN-10 Compare Entry`.
- The intended sequence remains `SUN-10 -> SUN-11 -> SUN-12 -> SUN-13`: finish the Figma review gate, implement the landing entry UI, implement search-result compare hierarchy, then refresh release evidence and docs.
- Public API, route contracts, search ranking, compare data semantics, Firebase, and AI/search logic are intentionally out of scope for this gate. If those appear necessary, split them into a follow-up rather than changing this flow.

Manual unblock checklist:

1. In Figma, ensure the page is named `SUN-10 Compare Entry`.
2. Ensure the target frame is named exactly `CompareEntry/Mobile/Brand-Musinsa`.
3. Ensure the child section/layer for the top navigation context is named exactly `TopNav/Context`.
4. Copy the real Figma node link for `CompareEntry/Mobile/Brand-Musinsa`.
5. Copy the real Figma node link for `TopNav/Context`.
6. Run the guarded apply command with those two copied URLs and `CONTRACT_VERIFIED`.

Do not pass placeholder values such as `FRAME_FIGMA_URL`, `SECTION_FIGMA_URL`, or
`FRAME_URL_FROM_FIGMA`. The runner rejects placeholders before generating evidence. The
URLs must include `node-id=` and must belong to file `Oj35jzmgbwnxzpTTqTcxLi`.

Key operator artifacts:

- `output/playwright/compare-entry-review-gate.md`
- `output/playwright/compare-entry-review-focus-plan.md`
- `output/playwright/compare-entry-review-surface-status-board.html`
- `output/playwright/compare-entry-figma-retry-packet.md`
- `output/playwright/compare-entry-figma-unblock-plan.md`
- `output/playwright/compare-entry-figma-capture-reference.md`
- `output/playwright/compare-entry-manual-node-evidence.md`
- `output/playwright/compare-entry-manual-node-apply-command.md`
- `output/playwright/compare-entry-manual-node-apply-command-readiness.md`
- `output/playwright/compare-entry-manual-unblock-cockpit.html`
- `output/playwright/compare-entry-manual-ui-slice-packet.md`
- `output/playwright/compare-entry-review-evidence-summary.md`
- `output/playwright/compare-entry-review-evidence-summary.json`
- `output/playwright/compare-entry-review-sessions/index.json`
- `output/playwright/compare-entry-review-sessions/latest-handoff.html`
- `output/playwright/compare-entry-review-sessions/latest-handoff.json`

If the gate is blocked by `figma-mcp-rate-limit`, keep the manual worksheet unchecked until
a real Figma node is created. The current blocker should appear as `activeBlocker` in the
gate JSON, focus plan, surface status board, closeout draft, Linear update draft, and
approval board. Automation should read `latest-handoff.json` or archive `index.json` instead
of parsing Markdown or HTML; artifact audit compares those JSON artifacts' `activeBlocker`
identity against the gate and keeps the gate blocked if they drift.
When repeated MCP retries are rate-limited, run `npm run ntl:compare-entry-figma-unblock-plan`
and choose either MCP quota resolution or manual Figma UI build. For the manual route, run
`npm run ntl:compare-entry-manual-ui-slice-packet` and use the generated node names, sizes,
copy, and acceptance checks before touching the worksheet. Do not use the code-first override
unless the `Design+Code` completion criterion is explicitly changed.
If `generate_figma_design` is used as a fallback, record it with
`npm run ntl:compare-entry-figma-capture-reference`; raw capture nodes are visual references
only and do not satisfy the worksheet until their Figma names match the target frame/section.
Before checking the worksheet from a manual Figma UI rebuild, run
`npm run ntl:compare-entry-manual-node-evidence` with the observed frame/section node IDs and
confirm `readyForWorksheetCheck: true`, then run
`npm run ntl:compare-entry-apply-manual-node-evidence`. The apply command is guarded and
does not edit the worksheet unless the evidence is complete.
You can pass either raw node IDs or copied Figma node URLs. If both the frame and section names
were manually verified against the contract and the visual slice matches the preview, use
`COMPARE_ENTRY_MANUAL_NODE_CONTRACT_VERIFIED=true` as the short-form confirmation.
Copied URLs must belong to Figma file `Oj35jzmgbwnxzpTTqTcxLi`; mismatched file keys keep
`readyForWorksheetCheck` false even when `CONTRACT_VERIFIED` is provided.
Use `npm run ntl:compare-entry-manual-node-apply` with the same node evidence env values to
chain evidence generation, guarded worksheet apply, finalize, and ready-check.
For copied Figma URLs, the runner also accepts positional args:

```bash
npm run ntl:compare-entry-manual-node-apply -- \
  'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=10-17' \
  'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=10-18' \
  CONTRACT_VERIFIED
```

The `CONTRACT_VERIFIED` argument is intentionally explicit and should only be used after
checking the target names and visual match in Figma UI.
Run `npm run ntl:compare-entry-manual-node-apply-command` to regenerate a copy-ready
command template from the current recommended slice and evidence state.
Run `npm run ntl:compare-entry-manual-node-apply-command-ready` to verify that the apply
command, cockpit, gate, target metadata, and manual evidence state are synchronized before
using copied Figma URLs.
Run `npm run ntl:compare-entry-manual-unblock-cockpit` to regenerate a single HTML cockpit
that combines the preview, required checks, apply command, evidence state, and gate links.

After the manual URL apply succeeds, rerun:

```bash
npm run ntl:compare-entry-review-finalize
npm run ntl:compare-entry-review-ready-check
```

Only when the ready-check exits `0` should implementation move to `SUN-11` and `SUN-12`.
`SUN-11` should update the landing entry surfaces (`CompareEntryPage`, `LandingCompareSearch`,
`SearchBar` visual shell, brand/category route entry surfaces) while preserving query and
route behavior. `SUN-12` should update search-result compare hierarchy and shortlist visual
continuity while preserving grouping, favorite payload, shortlist persistence, and detail
modal entry behavior.

Detailed guides:
- [docs/NETLIFY_DEPLOY.md](./docs/NETLIFY_DEPLOY.md)
- [docs/COMPARE_ENTRY_FUNNEL_MANUAL_FIGMA_BUILD_CHECKLIST.md](./docs/COMPARE_ENTRY_FUNNEL_MANUAL_FIGMA_BUILD_CHECKLIST.md)
- [docs/COMPARE_ENTRY_FUNNEL_VALIDATION_MATRIX.md](./docs/COMPARE_ENTRY_FUNNEL_VALIDATION_MATRIX.md)
- [docs/PLAYWRIGHT_MCP_UAT.md](./docs/PLAYWRIGHT_MCP_UAT.md)
- [docs/CLOUDFLARE_DEPLOY.md](./docs/CLOUDFLARE_DEPLOY.md) (kept as blocked alternative)
- [docs/MOBILE_DEVICE_TESTING.md](./docs/MOBILE_DEVICE_TESTING.md)

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
```

These scripts pin the native WebView to:

```text
https://loo-pyck.netlify.app
```

---

## 📊 Performance

| Metric | Target | Achieved |
|--------|--------|----------|
| Extraction Success | 90% | **94.2%** |
| Response Time (p95) | < 3s | **2.1s** |
| API Cost/Request | €0.01 | **€0.0005** |
| Lighthouse Score | 90 | **98** |

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

## 📄 License

MIT © 2026 LooPyck. All rights reserved.

---

<div align="center">

**Built with ❤️ and AI**

[Demo](https://loo-pyck.vercel.app) • [Docs](./docs/) • [Issues](https://github.com/sungjin9288/LooPyck/issues)

</div>
