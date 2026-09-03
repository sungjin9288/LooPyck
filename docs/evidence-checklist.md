# Evidence Checklist

| 항목 | 상태 | 증거 파일 | 비고 |
|---|---|---|---|
| 프로젝트 유형 판단 | 완료 | `docs/implementation-evidence.md` | 개인 / PoC 확장형 MVP |
| 구현 증거 기능 표 | 완료 | `docs/implementation-evidence.md` | 완료/개발 중/미구현 분리 |
| 로컬 실행 로그 | 완료 | `evidence/cli-logs/dev-server.log` | localhost:3100 |
| TypeScript 검증 | 완료 | `evidence/cli-logs/typecheck.log` | exit 0 |
| 테스트 검증 | 완료 | `evidence/cli-logs/test-adapters.log` | 526 pass (2026-09-03 working tree, `npm run test:adapters` summary) |
| Commerce signal 정제 | 완료 | `evidence/screenshots/commerce-signal-hygiene.png` | template/CSS dimension 오염 미노출 |
| Compare Entry review gate | 완료 | `output/playwright/compare-entry-review-gate.json` | gate/audit `READY`, active blocker `none` |
| Local pre-release QA | 완료 | `output/playwright/local-release-qa-summary.json` | embedded local manifest·commit·target·workspace fingerprint 일치 필수 |
| Fingerprint-linked demo flow | 완료 | `output/playwright/demo-flow-*.png` | 4개 실파일 + provenance-linked local QA fingerprint 일치 필수 |
| Search quality observation | 구현 완료 / production 재관찰 필요 | `output/playwright/{local,netlify}-search-quality-observation-report.md` | local cohort 복원, production 배포본은 cohort parser 미반영으로 HOLD |
| Direct source integration | 로컬 검증 완료 / deployment 후 재검증 필요 | `output/playwright/{local,netlify}-direct-source-integration-smoke.json` | SSF·Handsome·EQL·LF몰 direct hit, working-tree fingerprint 일치 필수; total active count는 관찰값 |
| Local system stress | 완료 | `output/playwright/local-system-stress-smoke.json` | served manifest strict schema·commit·workspace fingerprint·GHA run identity linkage와 production build route contract 100 concurrent requests 필수; production capacity claim 금지 |
| Portfolio claim integrity | 완료 | `output/playwright/portfolio-claim-audit.json` | current docs forbidden claim 0건, legacy docs fixed marker, fingerprint 일치 필수 |
| CI workflow integrity | 완료 | `output/playwright/ci-workflow-contract.json` | build/test/e2e job scope, blocking gate, build→stress→E2E 순서, `.next/`+provenance exact artifact paths, always-upload, CI self-audit, fingerprint 일치 필수 |
| Dependency audit policy | 구현/scoped baseline 일치, root build/dev 및 optional asset tool upstream debt 잔존 | `output/playwright/dependency-audit-policy.json` | 2026-09-03 root `15 high / 1 critical`, production `0 high / 0 critical`, optional tool `3 high / 1 critical`; 독립 cwd·baseline·review window 및 fingerprint 일치 필수 |
| Deployment provenance | 구현/로컬·Netlify CLI build 검증 완료, production 배포 대기 | `output/playwright/{local,netlify}-deployment-provenance.json` | hosted/GitHub explicit signal, repo-owned CLI marker, provider-scoped metadata, ambiguous signal fail-close, exact 11-field allowlist, deployId/runId 분리, smoke/UAT identity 일치 |
| Netlify production UAT | provenance step에서 차단 / deployment 대기 | `output/playwright/netlify-uat-summary.json` | 현재 manifest HTTP 404; provenance→public/admin API→public/admin browser 5-step gate는 새 build 배포 후 재실행 |
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
- Naver Shopping API 검색
- 다중 소스 realtime search
- style recommendation API
- price-history validation
- product matching, purchase pricing, purchase decision domain tests
- Compare Entry Figma gate, landing/search hierarchy, visual baseline과 release QA closure

## 검증 필요 기능

- live Gemini AI chat 답변의 운영 품질과 장기 대화 품질
- production deploy 최신 상태
- 실제 사용자 analytics

## 미구현 또는 근거 부족

- 운영 성과 수치
- 전환율/매출/사용자 수
- 모든 쇼핑몰 데이터 정확도 보장
