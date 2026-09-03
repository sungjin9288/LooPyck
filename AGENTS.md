# LooPyck — AGENTS.md

AI 기반 한국 패션 가격 비교 플랫폼. Next.js App Router + Firebase + Gemini 2.5 Flash로 실시간 검색, 가격 알림, AI 스타일 분석을 제공한다.

---

## Codex 운영 규칙

### 기본 실행 순서

- 비단순 작업은 먼저 `$repo-intake`로 repo 상태와 관련 문서, 검증 경로를 정리한다.
- Compare Entry funnel, compare/search 진입면, review artifact, Netlify compare-entry script 관련 작업은 `$loopyck-compare-entry` 기준으로 진행한다.
- 마무리 전에는 `$verify-gate` 기준으로 가장 관련성 높은 검증을 다시 수행한다.
- `tasks/todo.md`가 실제 진행 상태를 담는 경우가 많으므로, 작업 상태가 바뀌면 `$task-ledger-sync`를 함께 반영한다.
- review packet, baseline, gate artifact, playtest 산출물이 바뀌면 `$release-evidence`도 함께 갱신한다.

### 문서와 구현 우선순위

- Compare Entry 관련 작업은 구현보다 먼저 `tasks/todo.md`와 compare-entry 문서 묶음을 읽고 scope와 gate를 맞춘다.
- compare-entry docs, validation matrix, review checklist는 surface order와 review gate의 source of truth로 취급한다.
- 기존 repo 고유 규칙, 테스트 규칙, 배포 규칙은 유지하고 Codex 운영 규칙은 그 위에 병합해서 적용한다.

### Skill / MCP 추가 기준

- landing, compare funnel, product/search 화면을 실브라우저로 검증해야 할 때만 `$playwright`와 Playwright MCP를 추가한다.
- Figma URL, node-id, design handoff, review packet 정리가 포함될 때만 `$figma` 계열 skill과 Figma MCP를 추가한다.
- 의미 있는 UI/UX 재설계나 visual hierarchy 조정이면 `$frontend-skill`을 추가한다.
- Netlify preview, deploy, compare-entry review pipeline이 실제로 필요한 작업일 때만 `$netlify-deploy`를 추가한다.
- Linear에 연결된 이슈나 후속 운영 작업이 있을 때만 `$linear`와 Linear MCP를 추가한다.
- 추가 skill이나 MCP를 사용했다면 close-out에 왜 추가했는지 한 줄로 남긴다.

### 작업 원칙

- Compare Entry 변경은 관련 surface, frame, section 단위로 좁게 가져가고 임의로 funnel 범위를 넓히지 않는다.
- review-pipeline contract, artifact filename, `output/playwright/` 경로 규약을 깨지 않는다.
- 외부 데이터, Firebase, AI 응답, scraping adapter를 건드리면 기존 graceful degradation과 타입 검증 패턴을 유지한다.
- HTTP contract나 사용자-facing compare flow가 바뀌면 관련 테스트와 문서를 함께 갱신한다.

### 보고 방식

- close-out에서는 변경 파일, 실행한 검증, 갱신한 artifact 경로, 남은 리스크를 구분해서 적는다.
- compare-entry gate가 바뀌면 현재 gate 상태와 다음 blocked surface 또는 section을 같이 적는다.

## Tech Stack

| 항목 | 버전 |
|------|------|
| Next.js | 16.1.4 (App Router) |
| React | 18.3.1 |
| TypeScript | 5 (`strict: false`) |
| Tailwind CSS | 3.4.1 |
| Firebase (Client) | 12.8.0 |
| Firebase Admin | 13.6.1 |
| Zod | 4.3.6 |
| Framer Motion | 12.33.0 |
| Recharts | 3.7.0 |
| Capacitor | 8.1.0 (iOS/Android) |
| @toss/tds-mobile | 2.3.0 |
| @apps-in-toss/web-bridge / bridge-core | 2.10.6 (runtime) |
| @apps-in-toss/web-framework | 2.10.6 (build/dev) |
| TensorFlow.js | 4.22.0 |
| Cheerio | 1.2.0 |
| Lenis | 1.3.17 |

---

## 디렉토리 구조

```
app/
  api/              # API Routes (15개 상위 라우트)
    jobs/           # Cron 작업 (scan-price-alerts, alert-tuning-reminders)
    admin/          # 관리자 전용 API (access, alert-tuning-reminders)
  admin/            # 관리자 페이지
  ai-review-summary/  # AI 리뷰 요약
  brand/[brand]/    # 브랜드 상세 페이지
  category/[category]/
  product/[id]/     # 상품 상세 페이지
  favorites/        # 즐겨찾기 관리
  login/
  layout.tsx        # 루트 레이아웃 (ErrorBoundary 포함)
  page.tsx          # 홈 (URL ?q= 검색어 동기화)
  not-found.tsx     # 커스텀 404
  sitemap.ts        # 43개 URL
  manifest.ts

components/
  admin/            # 관리자 대시보드/리포트 (10개)
  agent/            # AI 시각화 (ThinkingProcess, ScanningEffect)
  auth/             # LoginModal, StyleDashboard
  chat/             # FashionBot
  favorites/        # FavoritesPage, AlertDetailView, ManagementPanel
  layout/           # Navbar, MobileNavigation, BrandTicker
  product/          # 상품 카드, 상세, 비교
  search/           # SearchBar, InfiniteProductGrid, VisualSearch
  shared/           # Button, Spinner, EmptyState, SocialShare, MarketTicker
  social/           # 소셜 기능

contexts/
  UserContext.tsx   # 전역 Auth 상태 (Firebase + Google OAuth)

hooks/
  useCloudStorage.ts       # Firestore 즐겨찾기 동기화
  useAlertInbox.ts
  useAlertPersona.ts
  useAlertTuningSettings.ts
  useGroupedProducts.ts
  useMultiSourceSearch.ts
  useRecentlyViewed.ts

lib/
  ai/               # Gemini 연동 (moodEngine, geminiJson 등)
  config/           # brands.ts (브랜드 목록), appConfig.ts
  core/             # notifications, userDna, errorHandler, observability 등
  favorites/        # 알림 개인화, 그룹핑
  native/           # Toss WebView / Capacitor 브릿지
  search/           # 검색 로직 (70+ 파일)
  security/         # requestGuards, urlSafety, demoGuard
  server/           # Firebase Admin 의존 서버 로직 (priceAlertScanner 등)
  types/            # 공유 TypeScript 타입

tests/              # Node.js native test runner 기반 (30+ 파일)
```

---

## 빌드 & 실행 명령어

```bash
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run lint         # TypeScript typecheck (eslint 아님)
npm run typecheck    # tsc --noEmit

# 테스트
npm run test:trends    # monthlyTrendAnalyzer 단일 테스트
npm run test:adapters  # 30+ 통합 테스트 (scraping, alerts, search 등)

# Netlify 배포 (프라이머리 배포 환경)
npm run ntl:deploy:preview   # preview 배포
npm run ntl:deploy:prod      # 프로덕션 배포
npm run ntl:smoke            # 스모크 테스트

# Cloudflare Workers 배포 (OpenNext 기반)
npm run cf:build             # Cloudflare 빌드
npm run cf:deploy            # Cloudflare 배포

# Capacitor 모바일
npm run cap:sync:prod        # Netlify URL 기준 iOS/Android 동기화
npm run cap:ios:prod         # iOS Xcode 열기
```

---

## 코딩 규칙

### DO

- **알림은 반드시 `pushAppNotification()` 사용**
  ```typescript
  import { pushAppNotification } from '@/lib/core/notifications';

  pushAppNotification({ title: '오류', message: '검색에 실패했습니다.', type: 'alert' });
  // type: 'info' | 'success' | 'alert'
  ```

- **API Route에 Zod 스키마 검증 추가**
  ```typescript
  const body = await req.json();
  const parsed = MySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  ```

- **API Route에 rate limiting 적용** (Upstash Redis + in-memory fallback 패턴)
  ```typescript
  const rateLimitResult = await checkRateLimit(ip, { requests: 30, window: 60 });
  if (!rateLimitResult.success) return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  ```

- **외부 fetch에 AbortSignal.timeout() 설정**
  ```typescript
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  ```

- **Firebase Admin 기능은 graceful degradation 처리**
  ```typescript
  if (!adminDb) return { enabled: false };
  ```

- **SSR에서 window 체크**
  ```typescript
  if (typeof window === 'undefined') return;
  ```

- **Firestore 데이터에 타입 가드 적용** (`isProduct()` 등)

- **API 응답에 Cache-Control 헤더 추가** (변경이 드문 데이터)
  ```typescript
  headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' }
  ```

- **Toss WebView 환경 감지** 후 UI 분기 (BottomSheet vs Modal)

### DON'T

- **`alert()` 절대 금지** → `pushAppNotification()` 사용
- **`console.log()` 프로덕션 코드에 남기지 않기** (디버그 후 제거)
- **Firebase Admin 없이 서버 기능 강제 실행 금지** — `enabled: false` 패턴으로 비활성화
- **`tsconfig.json`의 `strict: false`를 믿고 타입 무시 금지** — 명시적 타입 작성 필수
- **Vercel cron을 2개 이상 추가하지 않기** (Hobby plan 제한: 1개)
- **브랜드 목록을 컴포넌트에 하드코딩 금지** → `lib/config/brands.ts` 수정
- **`window.location.href` 대신 Next.js `router.push()` 사용**

---

## 핵심 설계 원칙

### 알림 시스템
`lib/core/notifications.ts`의 CustomEvent 기반 pub/sub 패턴. `NotificationSystem` 컴포넌트가 이미 `subscribeAppNotifications()`로 구독 중이므로 어디서든 `pushAppNotification()`만 호출하면 된다.

### 상태 관리
- **전역 Auth**: `contexts/UserContext.tsx` (Firebase Anonymous + Google OAuth, 익명→구글 계정 연동 지원)
- **즐겨찾기**: `hooks/useCloudStorage.ts` (Firestore 실시간 동기화, `isProduct()` 타입 가드 적용)
- **로컬 상태**: useState/useReducer (서버 상태는 API Route + SWR 패턴)

### API 호출 패턴
모든 AI API는 Gemini 2.5 Flash 사용. `lib/ai/geminiJson.ts`의 파싱 헬퍼 활용. 응답은 Zod 스키마로 검증.

### 서버/클라이언트 분리
- `lib/server/` — Firebase Admin SDK 의존 코드 (서버 전용)
- `lib/core/`, `lib/ai/` — 범용 (클라이언트 사용 가능하나 SSR 안전성 확인 필요)

### 배포 환경
- **Netlify**: 프라이머리 (`https://loo-pyck.netlify.app`). `netlify.toml` 설정.
- **Cloudflare Workers**: `@opennextjs/cloudflare` + `wrangler.jsonc` 기반. `cf:*` npm 스크립트.
- **Vercel**: 폴백용. `vercel.json`에 cron 1개 설정 (Hobby plan 제한).

### 모바일 지원
- **Capacitor**: Remote URL 모드 (`CAPACITOR_SERVER_URL` = Netlify URL로 WebView 래핑)
- **Toss WebView**: `lib/native/tossWebView.ts`로 감지, `@toss/tds-mobile` UI 분기 + `@apps-in-toss/web-bridge` runtime share 연동. `@apps-in-toss/web-framework`는 build/dev-only

### 이미지
`next.config.js`의 `remotePatterns`에 등록된 도메인만 허용. CDN: 무신사(`image.msscdn.net`), 29CM(`img.29cm.co.kr`). 포맷: WebP/AVIF 자동 변환.

---

## 테스트

Node.js 기본 테스트 러너 사용 (`--test` 플래그). Jest/Vitest 없음.

```bash
# 개별 실행
node --test tests/alertInbox.test.ts
node --test tests/favoriteGrouping.test.ts

# 전체 실행
npm run test:adapters
```

테스트 파일 위치: `tests/` 디렉토리. 커버리지 대상: search, alerts, favorites, scraping.

---

## 주의사항

### 절대 건드리지 않기
- `vercel.json`의 crons 배열 — 1개 이상이면 Hobby plan 초과 과금
- `CRON_SECRET` 환경변수 — Cron API 인증 토큰 (노출 시 무단 실행 가능)
- `firestore.rules` — 잘못 수정하면 프로덕션 데이터 접근 불가

### 조심할 것
- **TypeScript `strict: false`**: 런타임 오류 가능성 높음. 외부 데이터는 반드시 Zod 또는 타입 가드로 검증
- **Firebase Admin graceful degradation**: `lib/server/priceAlertScanner.ts` 등에서 `adminDb === null` 체크 항상 유지
- **Gemini API 비용**: AI 엔드포인트(`ai-insight`, `ai-chat`, `ai-vision` 등)는 rate limit 필수
- **`parseCurrentPrice()` Infinity 버그**: 이미 수정됨 — 가격 파싱 로직 수정 시 Infinity/NaN 엣지케이스 재확인
- **Toss 환경 분기**: `isTossWebView()` 판별 로직이 틀리면 iOS에서 UI 깨짐
- **Next.js Image 도메인**: 새 이미지 출처 추가 시 `next.config.js`의 `remotePatterns`에 등록 필수

### 환경변수 (`.env.local` 필요)
```
NEXT_PUBLIC_FIREBASE_*      # Firebase 클라이언트 설정
FIREBASE_ADMIN_*            # Firebase Admin SDK (서버 전용)
GEMINI_API_KEY              # Google AI Studio
UPSTASH_REDIS_REST_URL      # Rate limiting
UPSTASH_REDIS_REST_TOKEN
CRON_SECRET                 # Vercel/Netlify cron 인증
NEXT_PUBLIC_SITE_URL        # 배포 URL (Netlify/CF 빌드 시 필수)
SITE_URL                    # 서버 사이드 배포 URL
CAPACITOR_SERVER_URL        # Capacitor RemoteURL (모바일 앱)
```

---

## README 정직성 규칙 (포트폴리오 공개용 — 반드시 준수)

이 repo의 README는 채용 담당자·외부 방문자가 본다. README를 생성·수정할 때 아래를 **절대 규칙**으로 지킨다. 규칙을 어기면 작업을 멈추고 보고한다.

### 금지

- **측정 근거를 한 줄로 댈 수 없는 수치는 쓰지 않는다.** (예: "99.8% 비용 절감", "94.2% 자동화", "정확도 95%", "요청당 €0.0005")
  - 숫자를 쓰려면 **어떻게 쟀는지**(측정 커맨드·로그·방법)를 같은 자리에 표기한다. 못 대면 **삭제**한다.
- **과장 표현 금지**: "production-ready", "enterprise", "상용 운영", "엔터프라이즈". 실제가 PoC/MVP면 그대로 표기한다.
- 코드에 **없는** 기능·엔드포인트·성과를 적지 않는다. 추측 금지.

### 필수

- **테스트 수는 실제 코드로 카운트**해서 적고, 카운트 커맨드를 함께 둔다.
  - 예: `grep -rE "def test_" tests | wc -l`, `grep -rE "\b(test|it)\(" --include="*.test.*" | wc -l`
  - "정의된 함수 수"와 "통과 수"를 구분한다. 실제로 돌리지 않았으면 **"정의 기준 카운트, pass 여부는 별도 확인"**으로 표기.
- **엔드포인트·환경변수·디렉터리 구조는 코드/`.env.example`에서 직접 추출**한다. 손으로 지어내지 않는다.
- **`## Scope & Limitations` 섹션을 반드시 둔다.** 미구현·미검증·외부 의존·범위 밖 항목을 명시한다.
- **Demo·운영 URL은 접근 검증된 것만 링크**한다. 미검증이면 "(접근 검증 필요)"로 표기한다.

### 표준 구조

제목 → 한 줄 소개 → Why I Built This → Features → Tech Stack → Architecture → Key Design Decisions → Getting Started → (API/Usage) → Testing → Scope & Limitations → Links

### 갱신 절차

1. README를 고치기 전에 위 규칙을 먼저 적용한다.
2. 수정 후 **측정 근거 없는 새 수치가 들어가지 않았는지** 스스로 검사한다 (`99.8`, `production-ready` 등 grep).
3. 큰 변경은 "어디를 왜 바꿨는지"를 커밋 메시지/PR에 남긴다.
