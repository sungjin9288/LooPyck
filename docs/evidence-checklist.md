# Evidence Checklist

| 항목 | 상태 | 증거 파일 | 비고 |
|---|---|---|---|
| 프로젝트 유형 판단 | 완료 | `docs/implementation-evidence.md` | 개인 / PoC 확장형 MVP |
| 구현 증거 기능 표 | 완료 | `docs/implementation-evidence.md` | 완료/개발 중/미구현 분리 |
| 로컬 실행 로그 | 완료 | `evidence/cli-logs/dev-server.log` | localhost:3100 |
| TypeScript 검증 | 완료 | `evidence/cli-logs/typecheck.log` | exit 0 |
| 테스트 검증 | 완료 | `evidence/cli-logs/test-adapters.log` | 543 pass (2026-09-03 working tree, `npm run test:adapters` summary) |
| Commerce signal 정제 | 완료 | `evidence/screenshots/commerce-signal-hygiene.png` | template/CSS dimension 오염 미노출 |
| Compare Entry review gate | 완료 | `output/playwright/compare-entry-review-gate.json` | gate/audit `READY`, active blocker `none` |
| Local pre-release QA | 완료 | `output/playwright/local-release-qa-summary.json` | smoke command가 target별 stable path에 자동 저장, embedded local manifest·commit·target·workspace fingerprint 일치 필수 |
| Fingerprint-linked demo flow | 완료 | `output/playwright/demo-flow-*.png` | 4개 실파일 + provenance-linked local QA fingerprint 일치 필수 |
| Search quality observation | local·production release gate 연동, production 현재 `hold` | `output/playwright/{local,netlify}-search-quality-observation-report.{json,md}` | 24시간 freshness·5분 capture skew·served provenance·workspace fingerprint 일치 필수; cohort는 directional-only이며 production NAVER `disabled`/no-call 검증 완료 |
| Direct source integration | 로컬·production 검증 완료 | `output/playwright/{local,netlify}-direct-source-integration-smoke.json` | SSF·Handsome·EQL·LF몰 direct hit, working-tree fingerprint 일치 필수; total active count는 관찰값 |
| Local system stress | 완료 | `output/playwright/local-system-stress-smoke.json` | served manifest strict schema·commit·workspace fingerprint·GHA run identity linkage와 production build route contract 100 concurrent requests 필수; production capacity claim 금지 |
| Product grouping quality | curated regression 검증 완료 | `output/playwright/product-grouping-quality-benchmark.{json,md}` | 12 products / 66 pairs, precision·recall·F1 100%, false merge/split 0, workspace fingerprint 일치 필수; production accuracy claim 금지 |
| Portfolio claim integrity | 완료 | `output/playwright/portfolio-claim-audit.json` | current docs forbidden claim 0건, legacy docs fixed marker, fingerprint 일치 필수 |
| CI workflow integrity | 완료 | `output/playwright/ci-workflow-contract.json` | build/test/e2e job scope, blocking gate, build→stress→E2E 순서, `.next/`+provenance exact artifact paths, always-upload, CI self-audit, fingerprint 일치 필수 |
| Dependency audit policy | 구현/scoped baseline 일치, root build/dev 및 optional asset tool upstream debt 잔존 | `output/playwright/dependency-audit-policy.json` | 2026-09-03 root `15 high / 1 critical`, production `0 high / 0 critical`, optional tool `3 high / 1 critical`; 독립 cwd·baseline·review window 및 fingerprint 일치 필수 |
| Deployment provenance | 로컬·Netlify production 검증 완료 | `output/playwright/{local,netlify}-deployment-provenance.json` | production manifest가 provider `netlify`, clean workspace, expected commit을 기록하며 smoke/UAT identity 일치 |
| Netlify production UAT | 완료 | `output/playwright/netlify-uat-summary.json` | provenance→public/admin API→public/admin browser 5-step gate 통과 |
| Failure-safe release closeout | 완료 | `output/playwright/netlify-release-closeout-execution.json` | UAT 실패에도 runtime/report 실행, step exit/duration 기록, 전체 non-zero 보존 |
| PDP variant identity hygiene | 완료 | `output/playwright/{local,netlify}-release-qa-summary.json` | commerce action label 미포함 hard assertion |
| 환경 준비 상태 | 완료 | `evidence/cli-logs/env-check.log` | 값 없이 set 여부만 기록 |
| 웹앱 스크린샷 | 완료 | `evidence/screenshots/*.png` | 기존 지원 캡처 + 우선 포트폴리오 캡처 |
| 우선 포트폴리오 스크린샷 | 완료 | `evidence/screenshots/priority-*.png` | 검색, 결과, 가격 비교, AI 추천, 챗봇, 즐겨찾기/가격 알림 |
| API 응답 | 완료 | `evidence/api-responses/*.json` | 5 endpoints |
| API 요약 산출물 | 완료 | `evidence/output-artifacts/api-summary.json` | JSON summary |
| Mermaid architecture | 완료 | `evidence/architecture/*.mmd` | system + sequence |
| 민감정보 제외 | 완료 | `evidence/evidence_manifest.md` | 제외 패턴 검사 필요 |
| portfolio zip 갱신 | 완료 예정 | `_portfolio_export/loopyck_portfolio_pack.zip` | evidence 포함 재생성 |

## 검증 완료 기능

- 홈/검색/브랜드/카테고리/로그인/admin gate 화면 렌더링
- 메인 검색 화면, 상품 검색 결과, 가격 비교 상세 모달
- AI 스타일 추천 결과 화면
- AI chat source-aware fallback 응답, 검색 keyword 버튼, 검색 결과 재진입
- 즐겨찾기/가격 알림 empty state 화면
- Naver Shopping API 종료 격리와 legacy route `410 Gone`
- 다중 소스 realtime search
- style recommendation API
- price-history validation
- product matching, purchase pricing, purchase decision domain tests
- curated pairwise grouping quality benchmark와 `P-6000`/`P6000` model-code normalization
- Compare Entry Figma gate, landing/search hierarchy, visual baseline과 release QA closure

## 검증 필요 기능

- live Gemini AI chat 답변의 운영 품질과 장기 대화 품질
- production search-quality cohort의 장기 표본과 추세
- 실제 사용자 analytics

## 미구현 또는 근거 부족

- 운영 성과 수치
- 전환율/매출/사용자 수
- 모든 쇼핑몰 데이터 정확도 보장
