# Evidence Gallery

## Screenshots

### Priority Portfolio Screens

| 화면 | 파일 | 확인 내용 |
|---|---|---|
| 메인 검색 화면 | `evidence/screenshots/priority-01-main-search-screen.png` | 홈 검색 입력, 트렌드 칩, 검색 CTA |
| 상품 검색 결과 | `evidence/screenshots/priority-02-product-search-results.png` | 검색 결과, Search Fit, 비교 하이라이트, 상품 카드 |
| 가격 비교 화면 | `evidence/screenshots/priority-03-price-comparison-detail.png` | 상품 상세 모달, 비교 상태, decision block, 가격 알림/비교 후보 CTA |
| AI 추천 결과 | `evidence/screenshots/priority-04-ai-style-recommendation-result.png` | 체형/취향 기반 3개 룩 추천 결과와 검색 가능한 아이템 칩 |
| AI 챗봇 결과 | `evidence/screenshots/priority-05-ai-chatbot-result.png` | 챗봇 패널과 질문 흐름. 현재 AI 응답 오류가 재현되어 검증 필요 |
| 즐겨찾기/가격 알림 | `evidence/screenshots/priority-06-favorites-price-alerts-screen.png` | My Lookbook, Alerts/Variants/Compare Ready 요약, 가격 알림 필터 empty state |

### Supporting Screens

| 화면 | 파일 | 확인 내용 |
|---|---|---|
| Home | `evidence/screenshots/home.png` | 홈 UI, 검색 입력, 트렌드 영역 |
| Search loading | `evidence/screenshots/search-results.png` | 검색 query 진입 및 loading 상태 |
| Search results | `evidence/screenshots/search-results-longwait.png` | 검색 결과, Search Fit, 비교 하이라이트, 상품 카드 |
| Brand page | `evidence/screenshots/brand-musinsa.png` | 브랜드 랜딩 화면 |
| Category page | `evidence/screenshots/category-outer.png` | 카테고리 랜딩 화면 |
| Mobile login | `evidence/screenshots/mobile-login.png` | 모바일 viewport 로그인 화면 |
| Admin gate | `evidence/screenshots/admin-gate.png` | 관리자 진입 화면 |

## API Responses

| API | 파일 | 확인 내용 |
|---|---|---|
| `/api/search` | `evidence/api-responses/search.json` | Naver Shopping API 검색 응답 |
| `/api/realtime-search` | `evidence/api-responses/realtime-search.json` | realtime aggregation products/searchMeta |
| `/api/style-recommend` | `evidence/api-responses/style-recommend.json` | 3개 style looks |
| `/api/ai-chat` | `evidence/api-responses/ai-chat.json` | HTTP 200 응답, 품질 수동 검토 필요 |
| `/api/price-history` invalid input | `evidence/api-responses/price-history-missing.json` | invalid input validation error |

## CLI Logs

| 로그 | 파일 |
|---|---|
| Typecheck | `evidence/cli-logs/typecheck.log` |
| Adapter tests | `evidence/cli-logs/test-adapters.log` |
| Env check | `evidence/cli-logs/env-check.log` |
| Dev server | `evidence/cli-logs/dev-server.log` |
| Playwright screenshots | `evidence/cli-logs/playwright-screenshots.log` |

## Architecture

| 다이어그램 | 파일 |
|---|---|
| System flow | `evidence/architecture/system-flow.mmd` |
| Search sequence | `evidence/architecture/search-sequence.mmd` |
