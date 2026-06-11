# Implementation Evidence

## 1. 프로젝트 유형 판단

| 항목 | 판단 | 근거 |
|---|---|---|
| 프로젝트명 | LooPyck | `README.md`, `package.json` |
| 유형 | 개인 프로젝트 / PoC 확장형 MVP | 개인 GitHub remote, 단일 Next.js repo, 포트폴리오 문서 |
| 현재 상태 | MVP 구현 후 고도화 중 | `tasks/todo.md`, `docs/roadmap.md`, Netlify/Compare Entry 문서 |
| 도메인 | 패션 가격 비교 / AI 스타일 추천 | `app/api/search`, `app/api/realtime-search`, `app/api/style-recommend` |
| 이력서 반영 | 조건부 가능 | 구현 근거와 검증 로그는 있으나 운영 성과 수치는 검증 필요 |

## 2. 구현 증거가 필요한 기능

| 기능 | 상태 | 코드 근거 | 이번 증거 | 판단 |
|---|---|---|---|---|
| 홈/검색 UI | 검증 완료 | `app/page.tsx`, `components/search/SearchBar.tsx` | `evidence/screenshots/home.png`, `evidence/screenshots/search-results-longwait.png` | 포트폴리오 사용 가능 |
| 메인 검색 화면 | 검증 완료 | `app/page.tsx`, `components/search/SearchBar.tsx` | `evidence/screenshots/priority-01-main-search-screen.png` | 포트폴리오 우선 캡처 |
| 상품 검색 결과 화면 | 검증 완료 | `components/product/InfiniteProductGrid.tsx`, `components/product/searchResultSections.tsx` | `evidence/screenshots/priority-02-product-search-results.png` | 포트폴리오 우선 캡처 |
| 가격 비교 상세/decision block | 검증 완료 | `components/product/ProductDetailModal.tsx`, `components/product/PurchaseDecisionBlock.tsx`, `lib/product/purchaseDecision.ts` | `evidence/screenshots/priority-03-price-comparison-detail.png` | 포트폴리오 우선 캡처 |
| Naver Shopping API 검색 | 검증 완료 | `app/api/search/route.ts` | `evidence/api-responses/search.json`, `search.meta.txt` | 포트폴리오 사용 가능 |
| 다중 소스 실시간 검색 | 검증 완료 | `app/api/realtime-search/route.ts`, `lib/api/realtimeAggregator.ts` | `evidence/api-responses/realtime-search.json` | 포트폴리오 사용 가능 |
| 상품 그룹핑/구매 판단 | 검증 완료 | `lib/product/productMatching.ts`, `lib/product/purchasePricing.ts`, `lib/product/purchaseDecision.ts` | `evidence/cli-logs/test-adapters.log` | 포트폴리오 사용 가능 |
| AI style recommendation | 검증 완료 | `app/api/style-recommend/route.ts`, `lib/ai/styleRecommend.ts`, `components/recommend/StyleRecommender.tsx` | `evidence/api-responses/style-recommend.json`, `evidence/screenshots/priority-04-ai-style-recommendation-result.png` | 포트폴리오 우선 캡처 |
| AI chat | 검증 실패 / 검증 필요 | `app/api/ai-chat/route.ts`, `components/ai/StyleChat.tsx` | `evidence/api-responses/ai-chat.json`, `evidence/screenshots/priority-05-ai-chatbot-result.png` | API/챗봇 UI는 존재하나 UI 캡처에서 AI 응답 오류 재현 |
| 가격 이력 API validation | 검증 완료 | `app/api/price-history/route.ts` | `evidence/api-responses/price-history-missing.json` | 잘못된 입력 400 처리 확인 |
| Firebase/Admin 환경 | 검증 완료 | `lib/server/firebaseAdmin.ts`, `contexts/UserContext.tsx` | `evidence/cli-logs/env-check.log` | 값은 저장하지 않고 set 여부만 확인 |
| Admin gate 화면 | 검증 완료 | `app/admin/page.tsx`, `hooks/useAdminAccess.ts` | `evidence/screenshots/admin-gate.png` | 인증 게이트 화면 증거 |
| 모바일 로그인 화면 | 검증 완료 | `app/login/page.tsx`, `contexts/UserContext.tsx` | `evidence/screenshots/mobile-login.png` | 화면 증거 |
| 즐겨찾기/가격 알림 화면 | 검증 완료 / 데이터 empty state | `app/favorites/page.tsx`, `app/favorites/alerts/page.tsx`, `components/favorites/FavoritesPage.tsx` | `evidence/screenshots/priority-06-favorites-price-alerts-screen.png` | 화면 구조 확인, 저장 데이터는 없음 |
| Compare Entry redesign | 개발 중 | `docs/COMPARE_ENTRY_FUNNEL_EXECUTION_PLAN.md`, `components/landing/*` | 이번 실행 증거 없음 | 포트폴리오에서는 개발 중으로만 표현 |
| 운영 성과 수치 | 미구현 / 코드 근거 부족 | README 문구 외 검증 자료 없음 | 이번 실행 증거 없음 | 이력서 수치 표현 금지 |

## 3. 실행한 검증

| 검증 | 명령 | 결과 | 로그 |
|---|---|---|---|
| TypeScript typecheck | `npm run typecheck` | 통과 | `evidence/cli-logs/typecheck.log` |
| Adapter/domain tests | `npm run test:adapters` | 통과, 245 tests pass | `evidence/cli-logs/test-adapters.log` |
| Env readiness | `npm run env:check` | 통과, 값은 저장하지 않음 | `evidence/cli-logs/env-check.log` |
| Local dev server | `npx next dev --port 3100` | 실행 확인 | `evidence/cli-logs/dev-server.log` |
| Playwright screenshots | `npx playwright screenshot ...` | 7개 캡처 성공 | `evidence/cli-logs/playwright-screenshots.log` |
| API curl | `curl` against localhost:3100 | 5개 응답 저장 | `evidence/api-responses/*.meta.txt` |

## 4. API 응답 요약

- `/api/search`: HTTP 200, `display=3`, item count 3
- `/api/realtime-search`: HTTP 200, product count 19, result quality `mixed`
- `/api/style-recommend`: HTTP 200, 3 looks returned
- `/api/ai-chat`: HTTP 200 응답은 저장되어 있으나, 챗봇 UI 재시도에서는 AI 응답 오류가 표시됨. 원인 확인 전까지 검증 필요로 분리
- `/api/price-history`: 잘못된 입력에 HTTP 400 validation error 반환

자세한 요약: `evidence/output-artifacts/api-summary.json`

## 5. 미구현 / 검증 필요

- README의 비용 절감률, 자동화율 같은 수치 claim은 이번 증거로 검증하지 못했다.
- 실제 production 트래픽, 사용자 수, 전환율, 비용 절감액은 저장소 근거가 없다.
- AI chat은 API 응답과 UI 동작이 일관되지 않아 원인 확인이 필요하다. 현재 포트폴리오에서는 AI 추천 결과는 사용 가능, 챗봇은 검증 필요로 분리한다.
- Compare Entry Figma gate와 full redesign은 개발 중으로 분리해야 한다.

## 6. 포트폴리오 표현 가이드

### 사용 가능

- Next.js/Firebase/Gemini 기반 패션 가격 비교 MVP를 구현하고 로컬 실행/API/테스트 증거를 수집했다.
- 다중 쇼핑몰 검색, 상품 비교 판단, AI 스타일 추천 API를 실제 코드와 실행 로그로 검증했다.
- 외부 API와 AI 응답 안정성을 위해 validation, rate limit, timeout, fallback을 적용했다.

### 위험 표현

- 운영 성과 수치 달성
- 모든 쇼핑몰 실시간 최저가 보장
- 대규모 사용자 운영 경험
- production 품질 완전 검증
