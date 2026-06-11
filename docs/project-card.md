# Project Card

## 1. Snapshot

- 프로젝트명: LooPyck
- 프로젝트 유형: 개인 프로젝트 / PoC 확장형 서비스
- 기간: 확인 필요
- 현재 상태: 고도화 중
- 내 역할: 개인 개발자로 추정되나, 저장소만으로 직접 기여 범위는 확인 필요
- GitHub 링크: https://github.com/sungjin9288/LooPyck
- Demo 링크: https://loo-pyck.netlify.app
- 핵심 기술스택: Next.js App Router, React, TypeScript, Tailwind CSS, Firebase Auth/Firestore/Admin, Gemini 2.5 Flash, Naver Shopping API, Cheerio, Netlify, Capacitor
- 이력서 반영 가능 여부: 조건부 가능
- 판단 이유: 검색, 비교, AI 스타일 추천, 즐겨찾기, 가격 이력, 알림, 관리자 진단, 배포/검증 스크립트의 코드 근거가 있다. 다만 README와 일부 문서의 성과 수치, 정확도, 비용 절감 수치는 현재 코드만으로 검증되지 않아 이력서에서는 제외해야 한다.
- 분석 기준: 2026-06-09 현재 워킹트리와 최신 커밋 `e036792`(`feat: Apps in Toss (앱인토스) 통합 기반 설정`, 2026-03-18)을 함께 참고했다. 워킹트리에 기존 미커밋 변경이 많아, 포트폴리오 표현은 현재 파일 내용 기준으로만 작성한다.

## 2. One-liner

패션 상품을 여러 쇼핑몰에서 비교하려는 사용자의 가격/옵션/배송 판단 문제를 해결하기 위해 실시간 검색, 상품 그룹핑, 실구매가 근거, AI 스타일 추천을 개발 중인 패션 가격 비교 애플리케이션

## 3. Problem

- 이 프로젝트가 해결하려는 사용자 문제: 같은 패션 상품이나 유사 상품을 여러 쇼핑몰에서 따로 검색해야 하고, 표시 가격과 실제 결제 조건이 달라 구매 판단이 어렵다.
- 기존 방식의 불편함 또는 한계: 사용자가 직접 쇼핑몰별 검색어를 바꿔 입력하고, 옵션/배송비/회원가/재고 상태를 수동으로 비교해야 한다.
- 이 프로젝트에서 가장 중요한 문제정의: 단순 최저가 노출이 아니라 동일/유사 상품 여부, 옵션 일치, 실구매가, 재고, 배송 정책까지 함께 보여주는 비교 흐름이 필요하다.
- 컨설팅 경험과 자연스럽게 연결되는 부분:
  - 문제정의: 구매 의사결정에서 실제로 막히는 지점을 가격, 옵션, 배송, 신뢰도 단위로 나눔
  - 요구사항 정리: 검색, 비교, 즐겨찾기, 알림, 관리자 진단을 사용자/운영자 흐름으로 분리
  - 사용자 관점: 검색 결과에서 바로 비교 가능한 그룹과 일반 결과를 구분
  - 문서화: Netlify 배포, 모바일 테스트, Compare Entry funnel 문서와 검증 매트릭스를 작성
  - 기대효과 정리: 사용자가 여러 쇼핑몰을 오가며 확인하던 정보를 한 화면에서 비교할 수 있게 하는 방향

## 4. Solution

- 제공하려는 핵심 기능: 다중 쇼핑몰 검색, 패션 쿼리 분석, 비교 가능 상품 그룹핑, 실구매가/옵션/재고/배송 근거 표시, 즐겨찾기/가격 알림, AI 스타일 상담/이미지 검색/체형 기반 추천, 관리자 진단 대시보드
- 현재 실제로 제공 가능한 기능:
  - `/api/search` 기반 Naver Shopping API 검색
  - `/api/realtime-search` 기반 다중 소스 aggregate 검색과 fallback
  - `groupProducts()`, `comparePurchaseOffers()`, `buildPurchaseDecisionSummary()` 기반 비교/구매 판단 로직
  - Firebase Auth 및 Firestore 즐겨찾기 동기화
  - Gemini 2.5 Flash 기반 AI chat, vision, style recommendation API
  - Netlify 배포 스크립트와 smoke/UAT 스크립트
- 개발 중인 기능:
  - Compare Entry funnel의 Figma-first redesign gate
  - 검색 학습/운영 대시보드 고도화
  - price history, variant history, alert tuning 운영 안정화
- 아직 할 수 없는 기능:
  - 외부 쇼핑몰 데이터 품질과 정확도를 보장한다고 말할 수 없음
  - 성과 수치, 비용 절감률, 자동화율을 검증된 결과로 말할 수 없음
  - 모든 쇼핑몰의 옵션/재고 실시간 정확성을 보장할 수 없음
- 사용자 흐름: 검색어 입력 또는 브랜드/카테고리 진입 -> 다중 소스 검색 -> 비교 가능 그룹 확인 -> 상세에서 옵션/배송/재고/핏 판단 -> shortlist/favorites 저장 -> 목표가 알림 설정
- AI/IT 기술을 적용한 방식:
  - Gemini API를 chat, image-to-keyword, style recommendation에 사용
  - `analyzeFashionQuery()`로 패션 도메인 쿼리 검증/확장
  - Firestore에 가격 이력, 즐겨찾기, 알림 데이터를 저장
  - Next.js API Route에서 rate limit, timeout, Zod validation 적용

## 5. Tech Stack

| 영역 | 사용 기술 | 현재 사용 여부 | 근거 파일 |
|---|---|---|---|
| Language | TypeScript | 사용 중 | `package.json`, `tsconfig.json` |
| Frontend | Next.js 16, React 18.3.1, Tailwind CSS, Framer Motion | 사용 중 | `package.json`, `app/page.tsx`, `components/product/InfiniteProductGrid.tsx` |
| Backend | Next.js API Routes | 사용 중 | `app/api/search/route.ts`, `app/api/realtime-search/route.ts` |
| AI/LLM | Gemini 2.5 Flash | 사용 중 | `app/api/ai-chat/route.ts`, `app/api/ai-vision/route.ts`, `app/api/style-recommend/route.ts` |
| Database | Firebase Auth, Firestore, Firebase Admin | 사용 중 | `contexts/UserContext.tsx`, `hooks/useCloudStorage.ts`, `lib/server/firebaseAdmin.ts` |
| Infra/Deploy | Netlify, Vercel cron fallback, Docker, Cloudflare/OpenNext scripts | 사용 중 / 일부 검토 | `netlify.toml`, `vercel.json`, `Dockerfile`, `package.json` |
| Tools | Cheerio, Zod, Recharts, Capacitor, Toss Web Framework | 사용 중 | `package.json`, `lib/api/marketplaceScrapers.ts`, `.env.local.example` |
| Test | Node.js native test runner | 사용 중 | `package.json`, `tests/*.test.ts` |

## 6. Architecture

### 현재 아키텍처

```text
User
-> Next.js App Router UI
-> Search / Compare / Favorite / Admin components
-> Next.js API Routes
-> Search aggregator / AI routes / Firebase server modules
-> Naver Shopping API / marketplace scrapers / Gemini API / Firestore
-> Response with products, diagnostics, AI recommendation, alerts
```

### 목표 아키텍처

```text
User
-> Compare Entry funnel
-> Search result compare hierarchy
-> Product detail decision block
-> Favorites / alerts / shortlist continuity
-> Admin diagnostics and search-learning review
-> Release gate artifacts and Netlify UAT
```

### 설명

- 주요 데이터 흐름: 검색 query가 `app/api/realtime-search/route.ts`로 들어가고, `aggregateRealtimeSearchDetailed()`가 직접 소스와 Naver fallback을 합친 뒤 `rerankProductsByFashionRelevance()`와 diagnostics 저장을 수행한다.
- 주요 모듈 구성: `app/`은 route와 page, `components/`는 UI, `hooks/`는 client state, `lib/api`는 search adapter, `lib/product`는 비교/가격/옵션 판단, `lib/ai`는 Gemini 응답 처리, `lib/server`는 Firebase Admin 의존 기능을 담당한다.
- API 구조: `/api/search`, `/api/realtime-search`, `/api/ai-chat`, `/api/ai-vision`, `/api/style-recommend`, `/api/price-history`, `/api/jobs/scan-price-alerts`, `/api/admin/access` 등.
- AI/LLM 처리 흐름: route별 Zod schema와 rate limit을 통과한 요청이 Gemini 2.5 Flash로 전달되고, `parseGeminiJson()`으로 JSON 응답을 검증한다. `style-recommend`는 실패 시 deterministic fallback을 반환한다.
- DB 또는 저장소 구조: Firestore `artifacts/{appId}/users/{userId}/favorites`, alerts, devices와 server-side price history collection을 사용한다.
- 인증/보안/환경변수 처리 방식: Firebase client auth, Firebase Admin token verification, `ADMIN_UIDS`, `CRON_SECRET`, `GEMINI_API_KEY`, Naver API keys, rate limit, timeout, URL sanitization을 사용한다.
- 배포 구조가 있다면 설명: Netlify가 primary 배포 경로이고, Vercel cron은 fallback 형태로 설정되어 있다. Docker standalone image도 존재한다.
- 배포 구조가 아직 없다면: 해당 없음. 다만 Cloudflare Workers Free는 docs/task ledger 기준 size limit 제약이 있어 운영 경로로 확정하기 어렵다.

## 7. My Contribution

- 직접 구현했다고 설명 가능한 기능: 저장소 소유자/기여 이력이 확인되면 검색 API, 비교 그룹핑, 실구매가 계산, AI 추천 API, 즐겨찾기/알림, Netlify 검증 자동화 등을 설명 가능
- 설계했다고 설명 가능한 구조: 검색 aggregate -> diagnostics -> compare hierarchy -> detail decision block 흐름
- 문서화 또는 기획 측면 기여: Compare Entry funnel 문서 묶음, Netlify deploy guide, mobile testing guide, handover manual
- 문제 해결 또는 디버깅 사례: 외부 API timeout/fallback, Firebase Admin 미설정 graceful degradation, Netlify env size 제한 대응, Firebase authorized domain 이슈 문서화
- 면접에서 코드 수준으로 설명해야 할 부분: `app/api/realtime-search/route.ts`, `lib/api/realtimeAggregator.ts`, `lib/product/productMatching.ts`, `lib/product/purchasePricing.ts`, `app/api/style-recommend/route.ts`, `lib/security/requestGuards.ts`

## 8. Current Status

| 구분 | 기능 | 상태 | 근거 파일 | 이력서 반영 가능 여부 |
|---|---|---|---|---|
| 구현 완료 | Naver Shopping API 검색 | 구현 완료 | `app/api/search/route.ts` | 가능 |
| 구현 완료 | 다중 소스 실시간 검색과 fallback | 구현 완료 / 고도화 중 | `app/api/realtime-search/route.ts`, `lib/api/realtimeAggregator.ts` | 가능 |
| 구현 완료 | 상품 그룹핑/비교 근거 | 구현 완료 / 품질 고도화 중 | `lib/product/productMatching.ts`, `lib/product/purchasePricing.ts` | 가능 |
| 구현 완료 | AI chat/vision/style recommendation | 구현 완료 / 운영 품질 검증 필요 | `app/api/ai-chat/route.ts`, `app/api/ai-vision/route.ts`, `app/api/style-recommend/route.ts` | 가능 |
| 구현 완료 | Firestore 즐겨찾기 동기화 | 구현 완료 | `hooks/useCloudStorage.ts` | 가능 |
| 개발 중 | Compare Entry funnel redesign | 개발 중 | `docs/COMPARE_ENTRY_FUNNEL_EXECUTION_PLAN.md`, `components/landing/CompareEntryPage.tsx` | 조건부 가능 |
| 개발 중 | 검색 학습/운영 진단 대시보드 | 고도화 중 | `components/admin/SearchDiagnosticsDashboard.tsx`, `lib/search/searchLearning*.ts` | 조건부 가능 |
| 미구현 | 검증된 사업 성과 수치 | 미구현 | 코드 근거 없음 | 보류 |
| 검증 필요 | 운영 배포 상태와 실제 사용자 트래픽 | 검증 필요 | `docs/NETLIFY_DEPLOY.md`, smoke artifact는 별도 확인 필요 | 조건부 가능 |
| 문서상 존재, 코드 근거 없음 | 99.8% 비용 절감, 94.2% 자동화, 정확도/성공률 수치 | 문서상 존재, 코드 근거 없음 | `README.md`, `docs/ARCHITECTURE.md` | 보류 |

## 9. Evidence

- 주요 코드 파일: `app/page.tsx`, `components/product/InfiniteProductGrid.tsx`, `components/product/ComparisonHighlights.tsx`, `components/product/ProductDetailModal.tsx`
- 주요 함수/클래스: `aggregateRealtimeSearchDetailed()`, `analyzeFashionQuery()`, `groupProducts()`, `comparePurchaseOffers()`, `buildPurchaseDecisionSummary()`, `checkRateLimit()`, `parseGeminiJson()`
- 주요 API 엔드포인트: `/api/search`, `/api/realtime-search`, `/api/ai-chat`, `/api/ai-vision`, `/api/style-recommend`, `/api/price-history`, `/api/jobs/scan-price-alerts`, `/api/admin/access`
- 설정 파일: `package.json`, `next.config.js`, `netlify.toml`, `vercel.json`, `Dockerfile`, `.env.local.example`
- 실행 파일: `scripts/netlifySmokeCheck.mjs`, `scripts/netlifyUat.mjs`, `scripts/netlifyCompareEntryReviewPrep.sh`
- 테스트 파일: `tests/productMatching.test.ts`, `tests/purchasePricing.test.ts`, `tests/purchaseDecision.test.ts`, `tests/styleRecommend.test.ts`, `tests/compareShortlist.test.ts`, `tests/searchDiagnostics.test.ts`
- README 또는 문서 근거: `README.md`, `docs/NETLIFY_DEPLOY.md`, `docs/HANDOVER_MANUAL.md`, `docs/COMPARE_ENTRY_FUNNEL_EXECUTION_PLAN.md`
- 최근 git 근거: 최신 커밋은 `e036792`이며, 현재 `git status` 기준 README, app/api, components, lib, tests, docs, scripts 등에 다수의 미커밋 변경과 신규 파일이 있다. 따라서 “직접 구현” 범위는 저장소 소유자 확인 전까지 `확인 필요`로 유지한다.
- 실행 방법이 명확한지: `npm run dev`, `npm run typecheck`, `npm run test:adapters`, Netlify deploy/smoke script가 명확함
- 스크린샷/데모가 필요한 부분: 검색 결과, 상세 비교 decision block, 즐겨찾기/알림, 관리자 diagnostics, Compare Entry funnel

## 10. Consulting Angle

| 프로젝트 요소 | 연결되는 컨설팅 역량 | 이력서/면접 표현 | 근거 |
|---|---|---|---|
| 비교 구매 흐름 | 문제정의 | 사용자의 구매 판단 병목을 가격, 옵션, 재고, 배송 조건으로 구조화했다 | `lib/product/purchaseDecision.ts` |
| 검색/비교 API | 요구사항 정리 | 검색 결과를 단순 나열이 아니라 compare-ready 그룹과 일반 결과로 분리했다 | `components/product/InfiniteProductGrid.tsx` |
| Admin diagnostics | 업무 흐름 이해 | 운영자가 검색 품질과 fallback 상태를 확인할 수 있는 진단 화면을 구성했다 | `components/admin/SearchDiagnosticsDashboard.tsx` |
| Netlify/mobile 문서 | 문서화 | 배포, smoke, 모바일 QA 절차를 재사용 가능한 운영 문서로 정리했다 | `docs/NETLIFY_DEPLOY.md`, `docs/MOBILE_DEVICE_TESTING.md` |
| 가격/알림 데이터 | 데이터 해석 | 가격 이력과 목표가 알림 데이터를 사용자 행동 흐름에 연결했다 | `lib/server/priceHistoryStore.ts`, `lib/server/priceAlertScanner.ts` |

## 11. Safe vs Risky Expressions

### 써도 되는 표현

- Next.js App Router 기반 패션 가격 비교 웹 애플리케이션을 개발 중
- Naver Shopping API와 다중 쇼핑몰 scraping adapter를 통합한 실시간 검색 API 구현
- Firebase Auth/Firestore 기반 즐겨찾기 및 가격 알림 흐름 구현
- Gemini 2.5 Flash 기반 AI 스타일 상담, 이미지 검색 키워드 생성, 체형 기반 추천 API 구현
- Netlify 배포 및 smoke/UAT 검증 스크립트 정리

### 조건부로 가능한 표현

- 다중 쇼핑몰 가격 비교 서비스 배포 경험
- 검색 품질 진단/운영 대시보드 고도화 경험
- 모바일 WebView/Capacitor 기반 production QA 경험
- AI 기반 패션 추천 서비스 구현 경험

### 쓰면 위험한 표현

- 99.8% 비용 절감 달성
- 94.2% 자동화 달성
- 가격 정확도 98% 이상 보장
- 모든 쇼핑몰 실시간 최저가 보장
- 운영 사용자 기반 성과 달성
- 엔터프라이즈급 운영 안정성 확보

### 위험한 이유

- 성과 수치와 정확도 수치는 README/docs에 있으나 현재 코드와 테스트만으로 검증되지 않는다.
- 외부 쇼핑몰 scraping, API quota, Firebase/Admin 환경변수, 배포 권한은 운영 환경 의존성이 크다.
- 사용자 수, 매출, 전환율, 비용 절감액 등 실제 운영 지표가 저장소에서 확인되지 않는다.
