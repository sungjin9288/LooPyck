# README Improvement Plan

## 1. 현재 README의 문제점

- 코드 근거로 바로 검증하기 어려운 성과 수치가 첫 화면에 노출되어 있다: `99.8% 비용 절감`, `94.2% 자동화`, `₩0 인프라 비용`
- 현재 `package.json`은 React 18.3.1인데 일부 문서는 React 19 또는 Vercel 중심 설명을 포함해 문서 간 기준이 어긋난다.
- 구현 완료, 개발 중, 검증 필요 기능이 한 표 안에 섞여 있어 이력서/면접에서 설명하기 어렵다.
- Demo, deploy, smoke script는 잘 정리되어 있으나 최신 pass evidence와 screenshot이 README에서 바로 확인되지 않는다.
- 외부 쇼핑몰 scraping/AI 응답/Firestore Admin처럼 운영 환경 의존성이 큰 기능의 한계가 충분히 드러나지 않는다.
- 현재 README 자체도 워킹트리에서 수정된 상태이므로, 이 문서는 README를 직접 수정하지 않고 코드 근거 중심으로 재작성할 때 사용할 개선안으로만 유지한다.

## 2. README에 추가해야 할 섹션

# 프로젝트명

## 1. 프로젝트 개요
## 2. 개발 배경
## 3. 주요 기능
  - 구현 완료
  - 개발 중
  - 향후 개선
## 4. 기술 스택
## 5. 시스템 구조
## 6. 핵심 구현 내용
## 7. 실행 방법
## 8. 환경변수
## 9. 화면 예시
## 10. 개발 과정에서 해결한 문제
## 11. 비즈니스/사용자 관점의 적용 가능성
## 12. 향후 개선 계획

## 3. README 초안

# LooPyck

LooPyck은 패션 상품을 여러 쇼핑몰에서 검색하고, 가격/옵션/배송/재고 정보를 함께 비교할 수 있도록 개발 중인 Next.js 기반 패션 가격 비교 애플리케이션입니다.

Demo: https://loo-pyck.netlify.app

## 1. 프로젝트 개요

패션 상품은 같은 상품이라도 쇼핑몰마다 이름, 가격, 배송 조건, 옵션 표기가 다릅니다. LooPyck은 검색 결과를 단순히 나열하는 대신, 비교 가능한 상품 그룹과 구매 판단에 필요한 근거를 함께 보여주는 것을 목표로 합니다.

현재 저장소 기준으로 검색, 비교 그룹핑, 실구매가/배송/재고 판단, AI 스타일 추천, 즐겨찾기, 가격 알림 서버 로직, Netlify 배포 스크립트가 구현되어 있습니다.

## 2. 개발 배경

- 사용자는 여러 쇼핑몰을 오가며 같은 상품인지 직접 확인해야 합니다.
- 표시 가격만으로 실제 결제 가격을 판단하기 어렵습니다.
- 옵션/재고/배송 정책을 가격과 함께 확인해야 구매 결정을 내릴 수 있습니다.
- AI 기능은 스타일 상담, 이미지 기반 검색 키워드 생성, 체형 기반 추천처럼 검색 전후 흐름을 보조하는 방식으로 적용했습니다.

## 3. 주요 기능

### 구현 완료

| 기능 | 설명 | 근거 파일 |
|---|---|---|
| Naver Shopping API 종료 격리 | retired provider no-call, legacy route `410`, disabled diagnostics | `app/api/search/route.ts`, `lib/api/naverShoppingSearchLifecycle.ts` |
| 다중 소스 실시간 검색 | direct source 검색, tracked catalog fallback, diagnostics 생성 | `app/api/realtime-search/route.ts`, `lib/api/realtimeAggregator.ts` |
| 패션 쿼리 분석 | 패션 도메인 query validation, semantic expansion, rerank | `lib/search/fashionQueryAssistant.ts` |
| 상품 비교 그룹핑 | 브랜드/모델/카테고리/옵션 신호 기반 grouping | `lib/product/productMatching.ts` |
| 실구매가 판단 | 배송비, 혜택가, 재고, 쿠폰 추정 기반 구매 후보 정리 | `lib/product/purchasePricing.ts`, `lib/product/purchaseDecision.ts` |
| AI chat/vision/style recommendation | Gemini 2.5 Flash 기반 상담, 이미지 분석, 체형 기반 추천 | `app/api/ai-chat/route.ts`, `app/api/ai-vision/route.ts`, `app/api/style-recommend/route.ts` |
| 즐겨찾기 동기화 | Firebase Auth/Firestore 기반 favorites sync | `contexts/UserContext.tsx`, `hooks/useCloudStorage.ts` |
| 가격 이력/알림 서버 로직 | Firestore price history, 목표가 alert scanner, FCM 발송 시도 | `lib/server/priceHistoryStore.ts`, `lib/server/priceAlertScanner.ts` |
| Netlify 배포/검증 경로 | primary deploy target, smoke/UAT script | `netlify.toml`, `docs/NETLIFY_DEPLOY.md`, `package.json` |

### 개발 중

- Compare Entry funnel redesign
- search-learning/admin diagnostics 고도화
- alert tuning 운영 흐름
- 모바일/Capacitor real-device QA 문서화와 검증 흐름

### 향후 개선

- 실제 사용자 행동 로그 기반 검색 품질 지표 정의
- source별 검색 정확도/coverage 측정
- README screenshot/GIF와 최신 verification summary 추가
- 근거 없는 성과 수치 제거 또는 실제 측정 자료 연결

## 4. 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | Next.js 16, React 18.3.1, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Next.js API Routes |
| AI | Gemini 2.5 Flash |
| Search/Data | source-specific API/HTML adapters, Cheerio scraping adapters |
| Auth/DB | Firebase Auth, Firestore, Firebase Admin |
| Validation/Safety | Zod, rate limit, AbortSignal timeout, URL sanitization |
| Deploy | Netlify primary, Vercel cron fallback, Docker standalone |
| Mobile | Capacitor, Toss WebView related packages |
| Test | Node.js native test runner |

## 5. 시스템 구조

```text
User
-> Next.js UI
-> Search / Compare / Favorite / AI components
-> Next.js API Routes
-> Search aggregator / AI handlers / Firebase server modules
-> marketplace sources / Gemini API / Firestore
-> Product results, comparison groups, recommendations, alerts
```

## 6. 핵심 구현 내용

### Search Aggregation

`/api/realtime-search`는 query validation과 rate limit을 거친 뒤 `aggregateRealtimeSearchDetailed()`를 호출합니다. 활성 direct source 검색이 모두 비면 tracked catalog fallback을 사용합니다. 종료된 NAVER 쇼핑 검색 API는 호출하지 않고 diagnostics에 `disabled`로 기록합니다.

### Purchase Decision

`purchasePricing.ts`는 배송비, 혜택가, 재고 상태를 반영한 구매 후보를 계산합니다. `purchaseDecision.ts`는 옵션/재고/배송/핏을 카드 형태의 판단 요약으로 변환합니다.

### AI Features

AI 기능은 Gemini 2.5 Flash를 사용합니다. 모든 AI route는 request schema, timeout, JSON parsing을 적용하고, `ai-chat`, `ai-insight`, `style-recommend`는 API key 누락이나 upstream/parse 실패 시 source-aware fallback을 반환합니다.

### Firebase Integration

client side에서는 Firebase Auth와 Firestore favorites sync를 사용합니다. server side에서는 Firebase Admin SDK가 설정된 경우 가격 이력과 가격 알림 기능을 활성화하며, 설정이 없으면 기능을 비활성화합니다.

## 7. 실행 방법

```bash
npm install
npm run dev
```

로컬 앱:

```text
http://localhost:3000
```

검증:

```bash
npm run typecheck
npm run test:adapters
```

Netlify:

```bash
npm run ntl:deploy:preview
npm run ntl:deploy:prod
npm run ntl:uat
```

## 8. 환경변수

주요 환경변수는 `.env.local.example`을 기준으로 설정합니다.

필수 또는 운영 권장:

```text
NEXT_PUBLIC_FIREBASE_*
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
ADMIN_UIDS
GEMINI_API_KEY
CRON_SECRET
NEXT_PUBLIC_SITE_URL
SITE_URL
```

## 9. 화면 예시

추가 필요:

- 홈 검색 화면
- 검색 결과 compare-ready 그룹
- 상품 상세 decision block
- 즐겨찾기/가격 알림 화면
- 관리자 diagnostics 화면

## 10. 개발 과정에서 해결한 문제

- 외부 쇼핑몰 응답 실패: source별 timeout과 tracked catalog fallback 적용, retired provider는 lifecycle contract로 no-call 처리
- AI 응답 형식 불안정: Zod schema와 JSON parsing helper 적용
- Firebase Admin 환경변수 누락: Admin 기능 graceful degradation 처리
- Netlify runtime env 제한: `.netlify.env` allowlist와 sync script로 관리
- 검색 품질 확인 어려움: diagnostics, search-learning, admin dashboard로 운영 관찰 지점 추가

## 11. 비즈니스/사용자 관점의 적용 가능성

- 사용자는 여러 쇼핑몰을 따로 비교하는 시간을 줄일 수 있습니다.
- 구매 직전 필요한 가격, 옵션, 재고, 배송 정보를 한 화면에서 확인할 수 있습니다.
- 운영자는 검색 품질과 fallback 상태를 diagnostics로 확인하고 개선할 수 있습니다.

## 12. 향후 개선 계획

- README 코드 근거 중심 정리 유지
- demo screenshot/GIF 추가
- Compare Entry 완료 상태와 gate artifact 정합성 유지
- 검색 품질 평가 지표 수립
- production UAT 결과와 release evidence 정리
