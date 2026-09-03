# Evidence Gallery

## Screenshots

### Current Working-tree Demo Flow

아래 네 파일은 `RELEASE_QA_SCREENSHOTS=1` local release QA 한 세션에서 생성된다. 현재 코드와의 연결 여부는 `output/playwright/local-release-qa-summary.json`의 workspace fingerprint와 `output/playwright/release-closeout-report.md`의 `Fingerprint-linked demo screenshot packet` 판정으로 확인한다.

| 화면 | 파일 | 확인 내용 |
|---|---|---|
| 메인 검색 | `output/playwright/demo-flow-main-search.png` | Compare Entry hero, 검색 CTA, 트렌드/카테고리 진입 |
| 검색 결과 | `output/playwright/demo-flow-search-results.png` | Search Fit, summary metrics, compare-ready hierarchy |
| 상세 비교 | `output/playwright/demo-flow-detail-compare.png` | variant picker, decision block, 쇼핑몰 비교, 가격 이력 |
| Favorites | `output/playwright/demo-flow-favorites.png` | My Lookbook, saved/alerts/variants/compare-ready 요약 |
| Search quality observation | `output/playwright/local-admin-search-quality-observation.png` | badge cohort 표본, source health mix, HOLD/next-action 운영 판단 |
| Direct source integration | `output/playwright/local-direct-source-integration-smoke.json` | SSF·Handsome·EQL·LF몰 direct strategy/count/duration, full mode, current workspace fingerprint 일치 |
| Local system stress | `output/playwright/local-system-stress-smoke.json` | 100 concurrent deterministic route contracts, p95 latency, process-tree RSS delta, current workspace fingerprint |
| Portfolio claim integrity | `output/playwright/portfolio-claim-audit.json` | current portfolio docs 9개 + legacy planning docs 9개 policy audit과 current workspace fingerprint |
| CI workflow integrity | `output/playwright/ci-workflow-contract.json` | test/e2e job-scoped gate, current-workflow self-audit, execution order, failure artifact upload, current workspace fingerprint |
| Deployment provenance | `output/playwright/{local,netlify}-deployment-provenance.json` | build provider/context/deploy ID/commit, expected commit match, promotion-ready 경계 |
| Release closeout execution | `output/playwright/netlify-release-closeout-execution.json` | UAT/runtime/report 고정 순서, 각 exit code·duration, 최종 성공 여부 |

### Priority Portfolio Screens

| 화면 | 파일 | 확인 내용 |
|---|---|---|
| 메인 검색 화면 | `evidence/screenshots/priority-01-main-search-screen.png` | 홈 검색 입력, 트렌드 칩, 검색 CTA |
| 상품 검색 결과 | `evidence/screenshots/priority-02-product-search-results.png` | 검색 결과, Search Fit, 비교 하이라이트, 상품 카드 |
| 가격 비교 화면 | `evidence/screenshots/priority-03-price-comparison-detail.png` | 상품 상세 모달, 비교 상태, decision block, 가격 알림/비교 후보 CTA |
| AI 추천 결과 | `evidence/screenshots/priority-04-ai-style-recommendation-result.png` | 체형/취향 기반 3개 룩 추천 결과와 검색 가능한 아이템 칩 |
| AI 챗봇 결과 | `evidence/screenshots/priority-05-ai-chatbot-result.png` | fallback 출처 안내, 완전한 스타일 조언, 검색 keyword 버튼 렌더링 확인 |
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
| `/api/search` | `evidence/api-responses/search.json` | 2026-07-31 provider 종료 전 수집한 historical response; 현재 route는 `410 Gone` |
| `/api/realtime-search` | `evidence/api-responses/realtime-search.json` | realtime aggregation products/searchMeta |
| `/api/style-recommend` | `evidence/api-responses/style-recommend.json` | 3개 style looks |
| `/api/ai-chat` | `evidence/api-responses/ai-chat.json` | HTTP 200, `responseSource=fallback`, source/reason header 확인 |
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
