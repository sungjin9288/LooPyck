# LooPyck 리팩토링·디밸롭 점검 리포트 (2026-06-30)

> 읽기 전용 점검. 코드 변경 없음. 모든 수치는 실측 커맨드 기반. 다음 목표: **수집 쇼핑몰 확대 + 안정화**.

---

## 1. 현황 요약

### 1.1 Git 실측 (배경값과 차이 명시)

| 항목 | 배경(2026-06-29 스캔) | 실측(2026-06-30) | 비고 |
|------|------|------|------|
| 브랜치 | main | main | 일치 |
| origin 대비 ahead | 9 커밋 | **12 커밋** | `git rev-list --count origin/main..HEAD` = 12. 배경값보다 3 많음 |
| behind | (미명시) | **0** | `--left-right --count origin/main...HEAD` = `0 12` |
| 미커밋(modified) | 약 8 | **17 modified + 2 untracked = 19** | `git status --porcelain | wc -l` = 19. 배경값의 2배 |

- 미커밋 modified 17개는 대부분 최근 "에디토리얼 디자인 리프레시" 후속(컴포넌트 다수) + `playwright.config.ts`, `.github/workflows/deploy.yml`, `tailwind.config.ts`, `tasks/todo.md`, README, 2개 docs.
- untracked: `.claude/`, `.remember/` (운영 메타, 소스 아님).
- 로컬 브랜치에 `claude/*` 10개가 모두 동일 커밋(`e036792` Apps in Toss 통합 기반)에 정체 — 정리 후보(머지/삭제 미정).

최근 12커밋 성격: 디자인 리프레시 5건 + 테스트 추가 2건(Playwright E2E, Toss 판별 단위) + perf/fix/refactor. **즉, 미푸시 12커밋은 검증 자산(테스트·CI 게이트) 포함 → 푸시 가치 높음**(2.5절).

### 1.2 빌드/테스트 실측

| 검증 | 커맨드 | 결과 |
|------|--------|------|
| 단위·통합 테스트 | `npm run test:adapters` | **288 pass / 0 fail** (duration ~69s). 실행 확인됨 |
| 테스트 파일 수 | `ls tests/*.test.ts | wc -l` | 52 (`.mjs` 1개 별도) |
| E2E | `npm run test:e2e` (Playwright) | **미실행** — `next dev/start` 서버 기동 + chromium 필요해 본 점검에서 구동 안 함. 스펙은 `e2e/core-flows.spec.ts` 5개(아래 4장) |
| typecheck | `npm run typecheck` (`tsc --noEmit`) | 본 점검에서 미실행(시간). `tsconfig strict:false` 주의 |

> 정직성: README 등에서 "282 스펙" 표기가 보이나 실측 pass는 **288**이다(테스트가 추가됨). 문서 갱신 필요(5장).

### 1.3 수집(검색 집계) 아키텍처 — 실제 위치

핵심 수집 코드는 `lib/search/`가 **아니다**. `lib/search/`(68파일)는 대부분 "search learning ops/terminal" 운영 레이어다. 실제 수집·집계는:

- `lib/api/types.ts` — `ProductSource` 유니온(15개 소스), `UnifiedProduct`/`GroupedProduct` 표준 타입.
- `lib/api/sourceCatalog.ts` — 소스 메타데이터(라벨/뱃지/도메인/alias), `detectMarketplaceSource()`(NAVER 결과 mallName/도메인→소스 분류), 신뢰도 분류.
- `lib/api/marketplaceScrapers.ts` (901줄) — **config 주도 범용 Cheerio 스크레이퍼**. `MarketplaceAdapterConfig` 1개로 신규 쇼핑몰 1개 정의. JSON-LD 파서 + 카드 셀렉터 파서 2경로 + dedupe.
- `lib/api/realtimeAggregator.ts` (861줄) — NAVER API + 29CM API + Musinsa 스크레이퍼 + 위 12개 스크레이퍼를 `Promise.all`로 병렬 집계, 타임아웃 예산, NAVER 분류 폴백, 진단(diagnostics) 생성.
- `app/api/realtime-search/route.ts` — rate limit(60req/60s), Zod/길이 검증, 풀집계→NAVER-only→broad→tracked_catalog 4단 폴백.
- `lib/api/retailAdapter.ts` — `PlatformAdapter`(Shopify/Cafe24/Custom 정규화) 인터페이스. **현재 미배선**(아래 2.2).

---

## 2. 리팩토링 후보

### 2.1 [P0] 신규 소스 추가 시 `realtimeAggregator.ts` 보일러플레이트 폭발 (확장성 핵심 병목)
- **파일**: `lib/api/realtimeAggregator.ts`
- **문제**: 스크레이퍼 자체는 config 1개로 추가 가능하지만, 집계기에 소스를 "켜려면" 한 소스가 **6곳 이상**에 손으로 반복 등장한다:
  1. `DIRECT_SEARCH_SOURCES` 배열(L37) 2. import 목록(L17–30) 3. `aggregateRealtimeSearchDetailed` 내 `xxxQueries` 변수(L711–725) 4. `Promise.all` 배열의 `withTimedSearchBudget(...)` 줄(L744–758) 5. `xxxProducts` 추출(L761–775) 6. `mergeWithPreferredDirectProducts` 펼침(L778–793) 7. `buildAggregationDiagnostics` 인자 배열(L809–824).
  - 14개 소스 × 6~7 지점 = 변경 지점 다수. 신규 소스 1개 붙일 때 누락 1곳이면 조용히 빠진다(tsc가 다 못 잡음).
- **제안**: 소스→스크레이퍼 함수의 **레지스트리 테이블**(`Array<{ source, scrape, budgetMs }>`)을 도입하고, 집계기를 그 배열을 `map`하는 루프로 단일화. `sourceQueryPlan?.[source] || [query]`로 쿼리 선택. NAVER/29CM/Musinsa(특수 API 경로)는 같은 레지스트리에 어댑터 함수로 등록. → 신규 소스 추가가 **(a) sourceCatalog 항목 + (b) types 유니온 + (c) scraper config + (d) 레지스트리 1줄**로 축소.
- **난이도**: 중. **리스크**: 중(집계는 핵심 경로 — 폴백/진단/dedupe 동작 보존 필요, E2E·diagnostics 테스트로 가드 권장).

### 2.2 [P1] `retailAdapter.ts`(PlatformAdapter) 미배선 — 죽은 추상화 or 미완 기능
- **파일**: `lib/api/retailAdapter.ts`
- **문제**: Shopify/Cafe24/Custom DB 정규화용 `PlatformAdapter`/`GenericAdapter`가 정의돼 있으나 집계기·라우트 어디에서도 import되지 않음(`UnifiedProduct`와도 별도 `RetailProduct` 타입). 수집 확대 로드맵의 잔재이거나 미완.
- **제안**: (a) 확대 계획에 포함이면 `UnifiedProduct`로 수렴시키고 집계 레지스트리에 "API 소스" 어댑터로 편입, (b) 아니면 제거해 혼란 제거. 결정 필요.
- **난이도**: 소(제거) / 중(배선). **리스크**: 낮음.

### 2.3 [P1] 소스 enum이 3개 파일에 중복 정의 — 단일 진실원 부재
- **파일**: `lib/api/types.ts`(`ALLOWED_PRODUCT_SOURCES`), `lib/api/sourceCatalog.ts`(`SOURCE_CATALOG` 키), `lib/api/marketplaceScrapers.ts`(`SOURCE_PREFIXES`/`SOURCE_LABELS`).
- **문제**: 소스 라벨/prefix가 `sourceCatalog.ts`와 `marketplaceScrapers.ts`에 **이중 정의**(예: NAVER 라벨이 두 곳). 신규 소스 추가 시 둘 다 고쳐야 하며 drift 위험.
- **제안**: `marketplaceScrapers.ts`의 `SOURCE_PREFIXES`/`SOURCE_LABELS`를 제거하고 `getSourceIdPrefix()`/`getSourceMetadata().label`(sourceCatalog)로 일원화.
- **난이도**: 소. **리스크**: 낮음(테스트 존재).

### 2.4 [P2] `lib/search/` 운영 레이어 비대 (68파일, search-learning* 대다수)
- **문제**: `searchLearning*`/`searchLearningTerminal*` 파일이 수십 개로 `lib/search/` 디렉토리 신호를 흐린다. "수집 확대" 작업자가 실제 수집 코드(`lib/api/`)를 찾기 어렵게 함(본 점검에서도 첫 탐색이 오도됨).
- **제안**: `lib/searchLearning/`(또는 `lib/ops/searchLearning/`)로 폴더 분리해 수집 코어와 운영 학습 레이어를 물리적으로 구분. 순수 이동이라 리스크 낮음(import 경로만 갱신).
- **난이도**: 소~중(파일 수 많음). **리스크**: 낮음.

### 2.5 [P0/운영] 미푸시 12커밋 — **푸시 먼저 권장**
- 실측 ahead=12, behind=0 → fast-forward 푸시 가능(충돌 없음). 12커밋에는 **테스트 추가·CI 게이트(test/e2e job) 신설**이 포함돼 원격에 올려야 회귀 가드가 실제로 작동한다. 단, 미커밋 19건(특히 `.github/workflows/deploy.yml`의 test/e2e job 추가, `playwright.config.ts`)이 푸시에 **빠져 있으면** CI job이 절반만 반영된다 → **미커밋부터 커밋한 뒤 푸시**가 정합적.

---

## 3. 디밸롭 후보 (수집 확대·안정화)

| 후보 | 가치 | 난이도 | 의존성 | 현재 진척 |
|------|------|--------|--------|-----------|
| 집계 레지스트리화(2.1) 후 **신규 쇼핑몰 N개 추가** | 높음(목표 직결) | 추가당 소 | 2.1 선행 | 구조는 config 주도라 토대 양호 / 집계 배선이 병목 |
| 스크레이퍼 **재시도·백오프·per-host 동시성 제한** | 높음(안정성) | 중 | 없음 | **미구현**(4.1) |
| 스크레이퍼 **셀렉터 헬스 모니터링**(소스별 0건 연속 감지→알림) | 중 | 중 | diagnostics 존재 | diagnostics(`SearchSourceDiagnostic`)는 있음, 알림화 미구현 |
| `PlatformAdapter` API 소스(Shopify/Cafe24) 실배선 | 중 | 중 | 2.2 결정 | 추상화만 존재, 미배선 |
| E2E 커버리지 확장(상품상세/즐겨찾기 쓰기/소스뱃지) | 중 | 소~중 | Playwright 기동 | 5스펙만(렌더 가드 중심) |
| 디자인 리프레시 **시각 회귀 스냅샷** | 중 | 중 | Playwright | 미구현(4.3) |

---

## 4. 기술 부채·위험

### 4.1 [HIGH] 스크레이퍼 안정성 — 재시도·rate-limit 방어·동시성 제한 부재
- `marketplaceScrapers.ts`/`realtimeAggregator.ts`에 `retry`/`backoff`/`throttle`/`p-limit`/`robots` 패턴 **0건**(grep 확인). 단일 fetch 실패 시 즉시 `''`/빈배열 반환.
- **있는 방어**: `AbortSignal.timeout(8000)` 외부 fetch 타임아웃, 집계기 소스별 `withTimedSearchBudget`(3.5s) 레이스, `Promise.all` 병렬, `runTimedSearch` try/catch로 1소스 실패가 전체를 죽이지 않음(격리), 4단 폴백(full→naver_only→broad→tracked_catalog), `next:{revalidate:60}` 캐시.
- **리스크**: (a) 14개 소스를 동시 발사 → 어떤 소스의 봇 차단/429를 만나면 그 소스만 0건이 되고 **재시도 없이 영구 누락**처럼 보임. (b) 단일 User-Agent 고정·per-host 간격 없음 → 트래픽 증가 시 차단·IP 평판 악화 가능. (c) 셀렉터가 사이트 마크업 변경에 취약(카드 셀렉터 `[class*=...]` 휴리스틱) — 조용한 0건 회귀.
- **핵심 리스크 1~2**: ① **소스별 재시도/백오프 없음**(일시적 429·타임아웃이 곧 결측). ② **셀렉터 드리프트 무알림**(diagnostics에 기록은 되나 사람이 안 보면 모름).

### 4.2 [MED] `strict: false` + 외부 데이터
- `tsconfig.json strict:false`. 스크레이퍼/JSON-LD 파서가 `unknown`을 광범위 수용(방어적 코딩은 잘 돼 있음)하나, NAVER `parseInt(lprice)`·29CM `salePrice` 등 외부 수치는 타입 보장이 약함. 가격 `Number.isFinite`/`>0` 가드는 `buildProduct`에 존재(양호). 신규 소스가 가드를 우회하지 않도록 `buildProduct` 단일 관문 유지 필요.

### 4.3 [MED] 디자인 리프레시 후 렌더링 회귀 커버리지 공백
- 최근 5커밋이 에디토리얼 리프레시(히어로/카드/헤더/추천폼/상세모달/즐겨찾기). E2E는 **렌더 존재**만 검증(텍스트·배경색), **시각 회귀(스냅샷)**·상품상세/소스뱃지/비교 진입은 미커버. 리프레시가 레이아웃을 깨도 5스펙은 통과할 수 있음.
- `e2e/core-flows.spec.ts` 5건: 홈 검색뷰, 추천탭(blank 회귀 가드 ×2), 즐겨찾기 My Lookbook, 다크모드 비활성 가드. **양질이나 폭 좁음.**

### 4.4 [MED] Toss/Capacitor 모바일 빌드 건강성
- **건강 양호하나 통합 깊이 얕음(WebView 래핑 수준).**
- Capacitor: Remote URL 모드(`server.url`=Netlify), `cleartext:false`, push/splash/statusbar 플러그인 설정 정상. `cap:doctor` 스크립트 존재.
- Toss(Apps in Toss): `granite.config.ts` WebView partner 타입, `permissions: []`. `@apps-in-toss/web-framework` 실제 코드 참조는 **`granite.config.ts` + `lib/native/tdsMobile.ts` 2곳뿐**. `isTossWebView()` 판별은 단위테스트로 가드됨(tossWebView.test.ts, pass).
- **위험 지점**: ① `@toss/tds-mobile`은 동적 import + 실패시 null 폴백(graceful, 양호)이나 **TDS 컴포넌트 실사용 분기 범위가 매우 좁음** → "Toss 통합"은 사실상 WebView 호스팅 + 환경감지 수준(과장 금지 대상). ② Capacitor `webDir:'public'`은 server.url일 때 무시되지만, server.url 누락 시 빈 public을 로드 → `resolveCapacitorServerUrl()` env 의존(빌드 env 누락 위험). ③ `claude/*` 브랜치 10개가 Toss 기반 커밋에 정체.
- **한 줄**: WebView 래핑은 정상 동작 가능 상태이나, "네이티브 통합"으로 표기하면 과장 — 실측은 WebView + 환경분기 + 단위테스트 가드.

### 4.5 [LOW] `console.error/warn` 다수
- 스크레이퍼/집계기에 `console.error`/`console.warn` 다수(AGENTS.md는 `console.log` 금지). 디버그용 error 로깅은 의도적이나, `lib/core/observability`(Logger) 사용으로 통일 가능.

---

## 5. 정직성·문서

- **테스트 수 불일치(수정 필요)**: 코드 주석/README/CI 코멘트에 "282 스펙"이 남아 있으나 실측 `npm run test:adapters` = **288 pass**. `playwright.config.ts` 주석·`deploy.yml` 코멘트의 "282"를 실측치로 갱신하거나 "정의 기준 카운트, 실행 pass=288"로 명시.
- **검증 안 된 수치 없음(양호)**: 스크레이퍼/집계 코드에 정확도·절감률·성공률 하드코딩 수치 미발견. README 정직성 규칙(AGENTS.md L296~)이 강하게 명시됨.
- **"Apps in Toss 통합" 표현 주의**: 4.4 근거상 실제는 WebView 호스팅 + 감지. 문서에서 "네이티브 통합/엔터프라이즈" 류 과장 금지.
- **AGENTS.md 준수**: 본 점검은 읽기 전용·코드 미변경. compare-entry/review artifact 미변경. `tasks/todo.md`가 진행 상태 진실원이라는 규칙 확인(미변경).
- **구현/부분/미구현 구분**:
  - 구현: 15소스 타입·메타, config 주도 스크레이퍼, 병렬 집계+타임아웃+4단 폴백, diagnostics, rate limit, Toss/Capacitor WebView 빌드, 288 단위테스트, E2E 5스펙, CI test/e2e job(미커밋).
  - 부분: E2E 폭(렌더만), TDS 컴포넌트 분기(좁음), diagnostics→알림(데이터만).
  - 미구현: 스크레이퍼 재시도/백오프/per-host 동시성, `PlatformAdapter` 배선, 시각 회귀 스냅샷, 셀렉터 헬스 알림.

---

## 6. 우선순위 P0/P1/P2

**P0 (즉시·차단성)**
- P0-1: 미커밋 19건 커밋 → ahead 12+신규 **푸시**(behind 0, ff 가능). CI test/e2e job이 원격에서 실제 작동하도록.(2.5)
- P0-2: 집계기 **소스 레지스트리화**(2.1) — 수집 확대의 전제. 현 구조로 소스 추가 시 6~7곳 수동 동기화·누락 위험.

**P1 (확대·안정성)**
- P1-1: 스크레이퍼 **재시도·백오프·per-host 동시성 제한** 추가(4.1) — 안정화 목표 직결.
- P1-2: 소스 enum/라벨 **단일 진실원화**(2.3).
- P1-3: `retailAdapter` 배선 or 제거 결정(2.2).
- P1-4: 테스트 수 "282→288" 문서 정정(5장).

**P2 (정리·관측)**
- P2-1: `lib/search/` 운영 학습 레이어 폴더 분리(2.4).
- P2-2: diagnostics 기반 **셀렉터 헬스 알림**(소스 연속 0건 감지).
- P2-3: E2E 확장 + 시각 회귀 스냅샷(4.3).
- P2-4: `console.*`→Logger 통일(4.5), 정체 `claude/*` 브랜치 정리.

---

## 7. 권장 다음 액션 (3~5)

1. **미커밋 커밋 후 푸시** — `.github/workflows/deploy.yml`(test/e2e job), `playwright.config.ts` 포함해 커밋하고 ahead 푸시. 그래야 회귀 가드가 원격 CI에서 작동.
2. **집계기 레지스트리 리팩토링(P0-2)** — `realtimeAggregator.ts`의 14소스 수동 반복을 `{source, scrape, budgetMs}[]` 루프로 축약. 기존 diagnostics/폴백/dedupe 동작은 `searchDiagnostics.test.ts`+E2E로 가드.
3. **신규 쇼핑몰 1개를 레지스트리 방식으로 추가**해 "추가 절차(catalog+types+scraper config+레지스트리 1줄)"를 실증·문서화. 가이드는 아래 부록.
4. **스크레이퍼 안정화** — 소스별 1~2회 재시도+지수 백오프, `p-limit`류 per-host 동시성 캡, User-Agent 로테이션 검토(4.1).
5. **셀렉터 드리프트 가드** — diagnostics의 소스별 0건을 누적/알림(또는 nightly 스크레이프 스모크)으로 승격해 마크업 변경을 조용히 놓치지 않게.

---

## 부록: 새 쇼핑몰 어댑터 추가 가이드 (실제 파일 경로)

스크레이핑 기반 소스(HTML/JSON-LD) 1개 추가 시:

1. `lib/api/types.ts` — `ALLOWED_PRODUCT_SOURCES` 유니온에 새 소스 키 추가(`ProductSource` 자동 확장).
2. `lib/api/sourceCatalog.ts` — `SOURCE_CATALOG`에 메타(label/badge/domains/aliases/idPrefix) 추가, 필요시 `DETECTION_ORDER`/`OFFICIAL_RETAIL_SOURCES`에 포함(NAVER 분류 폴백용).
3. `lib/api/marketplaceScrapers.ts` — `XXX_SCRAPER_CONFIG: MarketplaceAdapterConfig`(searchUrl/absoluteOrigin/cardSelectors/title/price/link/linkPattern…) 1개 + `scrapeXxx()` 래퍼 1개 작성. (현재 `SOURCE_PREFIXES`/`SOURCE_LABELS`에도 키 추가 필요 — 2.3 일원화 전까지.)
4. `lib/api/realtimeAggregator.ts` — **현재**: import + `DIRECT_SEARCH_SOURCES` + `xxxQueries` + `Promise.all` 줄 + `xxxProducts` + merge 펼침 + diagnostics 인자, 7곳 추가. **레지스트리화(P0-2) 후**: 레지스트리 배열에 `{ source:'XXX', scrape: scrapeXxx, budgetMs }` 1줄.
5. `tests/marketplaceScrapers.test.ts` — 해당 소스 카드/JSON-LD 픽스처 파싱 테스트 1개 추가(기존 12소스 패턴 그대로).
6. (이미지 도메인 사용 시) `next.config.js` `remotePatterns`에 CDN 호스트 등록.

API 기반 소스(공식 오픈API)는 NAVER/29CM처럼 `realtimeAggregator.ts`에 전용 fetch 함수로 추가하거나, `retailAdapter.ts`의 `PlatformAdapter`를 배선해 `UnifiedProduct`로 정규화(2.2 결정 후).
