# Interview Story

## 1. 1분 프로젝트 소개

이 프로젝트는 패션 상품을 여러 쇼핑몰에서 비교할 때 가격, 옵션, 배송, 재고 정보를 따로 확인해야 하는 문제를 해결하기 위해 시작했습니다.
저는 확인 필요 상태의 개인 개발자로서 현재 저장소 기준 검색 API, 상품 비교 로직, AI 추천 API, 즐겨찾기/가격 알림 흐름을 개발했습니다.
기술적으로는 Next.js App Router, TypeScript, Firebase, Gemini 2.5 Flash, Naver Shopping API, Cheerio, Netlify를 사용했고, 현재는 배포 가능한 MVP를 고도화하는 단계까지 구현했습니다.
개발 과정에서 외부 쇼핑몰 응답 실패, AI 응답 형식 불안정, Firebase Admin 환경변수 의존성이 있었고, 이를 rate limit, timeout, Zod validation, fallback, graceful degradation으로 해결했거나 해결 중입니다.
이 프로젝트를 통해 AI 기능을 사용자 구매 흐름에 연결하는 방법과 외부 의존성이 큰 서비스를 검증 가능하게 문서화하는 방법을 배웠고, 향후에는 Compare Entry funnel과 검색 품질 지표를 중심으로 고도화할 계획입니다.

## 2. 3분 상세 설명

- 프로젝트 배경: 패션 구매자는 상품을 검색한 뒤에도 같은 상품인지, 옵션이 맞는지, 배송비와 회원가를 포함해 실제로 어디가 저렴한지 판단해야 한다.
- 문제정의: 검색 결과를 단순 나열하지 않고, compare-ready 상품 그룹과 구매 판단 신호를 함께 제공해야 한다.
- 기술 선택 이유: Next.js는 UI/API 통합 개발에 적합하고, Firebase는 Auth/Firestore/Admin 기능을 빠르게 구성할 수 있으며, Gemini API는 chat/vision/style recommendation을 하나의 모델 라인으로 처리할 수 있다.
- 핵심 구현:
  - `/api/realtime-search`에서 다중 소스 검색, fallback, diagnostics, price history side effect 처리
  - `lib/product/productMatching.ts`에서 동일/유사 상품 그룹핑
  - `lib/product/purchasePricing.ts`와 `purchaseDecision.ts`에서 실구매가/배송/재고/핏 판단 요약
  - `/api/ai-chat`, `/api/ai-vision`, `/api/style-recommend`에서 Gemini 연동과 fallback 처리
  - `hooks/useCloudStorage.ts`에서 Firestore favorites sync
- 현재 상태: 배포 가능한 MVP와 운영/검증 문서가 있고, Compare Entry redesign과 search diagnostics를 고도화 중이다.
- 앞으로의 개선 방향: README 정리, 검증 artifact 정리, demo capture, Compare Entry design approval, production analytics 기반 품질 지표 확보
- 컨설팅 경험과의 자연스러운 연결: 사용자 문제를 기능 단위로 쪼개고, 요구사항/검증 기준/운영 문서로 정리한 점을 연결한다.
- 답변 시 git 상태 주의: 현재 저장소는 미커밋 변경이 많은 진행형 상태이므로, 면접에서는 “현재 파일 기준으로 구현되어 있다”, “최신 검증은 별도로 제시하겠다”처럼 근거와 상태를 분리해 말한다.

## 3. 기술 면접 예상 질문 10개

| 예상 질문 | 답변 방향 | 코드 근거 | 보완 필요 지식 |
|---|---|---|---|
| 다중 쇼핑몰 검색은 어떻게 동작하나요? | source-aware query plan으로 직접 소스와 Naver fallback을 결합한다고 설명 | `app/api/realtime-search/route.ts`, `lib/api/realtimeAggregator.ts` | 외부 API 장애 대응, scraping 한계 |
| 상품이 같은 상품인지 어떻게 판단하나요? | 브랜드/모델/카테고리/옵션/성별 신호 기반 grouping 설명 | `lib/product/productMatching.ts` | 정보검색 유사도, precision/recall |
| 표시 가격과 실구매가는 어떻게 다루나요? | 배송비, 혜택가, 쿠폰 추정, 재고 상태를 `PurchasePriceEstimate`로 계산 | `lib/product/purchasePricing.ts` | 가격 정책 모델링 |
| AI 응답이 깨지면 어떻게 하나요? | Zod schema, `parseGeminiJson()`, fallback response 설명 | `app/api/style-recommend/route.ts`, `lib/ai/geminiJson.ts` | LLM structured output reliability |
| Firebase Admin이 없으면 서버 기능은 어떻게 되나요? | Admin SDK 미설정 시 null 반환하고 기능 enabled=false 처리 | `lib/server/firebaseAdmin.ts`, `lib/server/priceAlertScanner.ts` | serverless env 관리 |
| API abuse는 어떻게 막나요? | IP/UA 기반 rate limit, Upstash Redis optional fallback, timeout 설명 | `lib/security/requestGuards.ts` | distributed rate limiting |
| 가격 알림은 어떻게 생성되나요? | favorites collectionGroup을 scan하고 목표가 도달 시 alert/FCM 생성 | `lib/server/priceAlertScanner.ts` | Firestore query/index, FCM |
| 이미지 검색은 어떻게 구현했나요? | image base64/mime validation 후 Gemini vision prompt로 검색 키워드 생성 | `app/api/ai-vision/route.ts`, `components/search/VisualSearch.tsx` | image payload 보안 |
| 배포는 어떻게 검증하나요? | Netlify deploy, UAT, browser smoke, release closeout script 설명 | `package.json`, `docs/NETLIFY_DEPLOY.md` | CI/CD 자동화 |
| 타입 안정성은 어떻게 확인하나요? | TypeScript typecheck와 Node native tests 사용 | `package.json`, `tests/*.test.ts` | strict mode 강화 |

## 4. 프로젝트 면접 예상 질문 10개

| 예상 질문 | 답변 방향 | 근거 | 보완 필요 사항 |
|---|---|---|---|
| 왜 패션 가격 비교를 주제로 선택했나요? | 구매 판단이 가격만으로 끝나지 않는 문제를 해결하려 했다고 설명 | `lib/product/purchaseDecision.ts` | 사용자 인터뷰 근거 |
| MVP의 핵심 기능은 무엇인가요? | 검색, 비교 그룹핑, 상세 decision block, favorites/alert, AI 추천 | `app/page.tsx`, `components/product/*` | 데모 시나리오 |
| 현재 완성도는 어느 정도인가요? | 배포 가능한 MVP 고도화 단계, 수치 성과는 검증 필요 | `docs/NETLIFY_DEPLOY.md`, `tasks/todo.md` | 최신 배포 상태 확인 |
| 가장 어려웠던 점은 무엇인가요? | 외부 소스 품질과 동일 상품 판별이 어려웠다고 설명 | `lib/api/marketplaceScrapers.ts`, `lib/product/productMatching.ts` | 정량 평가 |
| 어떤 부분을 직접 설명할 수 있나요? | realtime search route, matching, purchase pricing, Gemini fallback | 코드 파일 | 본인 구현 범위 확인 |
| 기존 README에서 무엇을 고쳐야 하나요? | 성과 수치를 근거 없는 claim에서 위험 표현으로 분리 | `README.md` | 실제 측정 자료 |
| 사용자는 어떤 흐름으로 쓰나요? | 검색/브랜드/카테고리 진입 -> compare-ready group -> detail -> save/alert | `app/page.tsx`, `app/brand/[slug]/page.tsx` | UX 녹화 |
| 이 프로젝트의 차별점은 무엇인가요? | 최저가 나열보다 구매 판단 근거를 함께 보여주는 흐름 | `purchaseDecision.ts` | 경쟁 서비스 비교 |
| 운영자 관점 기능은 무엇인가요? | admin diagnostics와 search-learning 상태 확인 | `components/admin/SearchDiagnosticsDashboard.tsx` | admin demo 접근 |
| 다음에 개선할 기능은 무엇인가요? | README 정리, demo capture, Compare Entry gate, analytics 지표 | `docs/COMPARE_ENTRY_FUNNEL_EXECUTION_PLAN.md` | 우선순위 계획 |

## 5. 컨설팅 경험과의 연결 질문 5개

| 예상 질문 | 답변 방향 | 주의할 점 |
|---|---|---|
| 컨설팅 경험이 개발에 어떻게 도움이 됐나요? | 문제를 사용자 흐름, 요구사항, 검증 기준으로 구조화한 경험을 연결 | 특정 도메인으로 억지 연결하지 않기 |
| 요구사항은 어떻게 정리했나요? | 가격/옵션/재고/배송/AI 추천/운영 진단으로 나눠 구현 범위를 정의 | 구현 안 된 기능을 완료처럼 말하지 않기 |
| 사용자 관점은 어떻게 반영했나요? | 검색 결과보다 구매 판단 신호를 먼저 보게 하는 흐름을 설명 | 사용자 피드백이 없으면 없다고 말하기 |
| 문서화 역량은 어디서 보이나요? | Netlify, mobile QA, Compare Entry validation docs를 근거로 설명 | 문서와 코드 불일치를 숨기지 않기 |
| 개선안 도출은 어떻게 했나요? | README 위험 표현 정리와 roadmap으로 다음 작업을 제시 | 성과 수치 만들지 않기 |

## 6. 내가 추가로 공부해야 할 부분

- 기술: Next.js server/runtime boundary, React performance, Firestore query/index 설계
- 아키텍처: external data integration, fallback strategy, search quality evaluation
- 보안: API abuse prevention, secret management, image upload validation, Firebase rules
- 배포: Netlify Functions env limit, CI/CD pipeline, Docker production runtime
- 테스트: Playwright visual regression, API integration test, source quality benchmark
- AI/LLM: structured output, prompt evaluation, deterministic fallback, hallucination control
- CS 기초: HTTP caching, rate limiting, data normalization, ranking/scoring algorithm
