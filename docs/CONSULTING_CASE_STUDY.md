# LooPyck Consulting Case Study

## Case Scope

LooPyck은 분산된 패션 상품 정보를 검색하고 비교하는 과정에서 사용자가 겪는 구매 판단 비용을 줄이기 위한 개인 프로젝트다. 이 문서는 실제 매출, 비용 절감, FTE 대체 성과가 아니라 문제 구조화, 구현 선택, 검증 가능한 결과를 설명한다.

## Problem

쇼핑몰마다 상품명, 가격, 할인, 배송, 재고, 옵션 구조가 달라 동일 상품을 직접 비교하기 어렵다. 외부 source의 URL과 markup도 변경되므로 단순 scraper 성공 여부만으로 검색 품질을 보장할 수 없다.

## Approach

1. source별 direct adapter와 Naver classified fallback을 분리했다.
2. 검색 결과를 product matching과 compare-ready hierarchy로 재구성했다.
3. 상세 화면에서 실구매가, 배송, 재고, 옵션, 가격 이력을 구매 판단 근거로 노출했다.
4. admin diagnostics에 source health, fallback, interaction cohort를 표시했다.
5. local working-tree fingerprint를 QA artifact에 기록해 배포본 증빙과 미배포 변경 증빙을 분리했다.

## Implementation Evidence

| 영역 | 코드/산출물 | 확인 가능한 결과 |
|---|---|---|
| Realtime aggregation | `app/api/realtime-search/route.ts`, `lib/api/realtimeAggregator.ts` | direct/fallback diagnostics와 graceful degradation |
| Source recovery | `lib/api/marketplaceScrapers.ts`, `lib/api/searchSourceRegistry.ts` | SSF, Handsome, EQL, LF Mall direct-source smoke |
| Compare workflow | `lib/product/productMatching.ts`, `lib/product/purchasePricing.ts` | matching, option alignment, purchase pricing tests |
| Release evidence | `scripts/buildReleaseCloseoutReport.mjs` | local/deployed evidence와 workspace fingerprint 분리 |
| Local stress | `scripts/localSystemStressSmoke.mjs` | served build manifest와 runner commit/fingerprint/CI run linkage 후 100 concurrent route-contract requests |

## Verified Results

- adapter/domain tests: `504/504` pass
- system stress contract tests: `10/10` pass
- local production-build stress: `100/100` requests pass, concurrency `100`
- p95 latency and process-tree RSS before/peak/after are recorded in the current stress artifact
- direct-source local smoke: required four sources each returned direct hits; total active source count is observed, not guaranteed

측정값은 2026-07-15 단일 local run과 현재 artifact에 한정된다. 운영 SLA, 월간 처리량, 사용자 동시 접속 규모, 비용 절감률로 확장 해석하지 않는다.

## Consulting Takeaway

핵심 기여는 성과 수치를 가정하는 것이 아니라 다음 의사결정 구조를 만든 점이다.

- 어떤 source가 직접 응답했고 어디서 fallback이 발생했는가
- 어떤 상품이 비교 가능한가
- 사용자가 구매 전에 확인해야 할 가격/옵션/배송/재고 근거는 무엇인가
- 로컬 변경과 배포 환경 중 어느 쪽이 검증된 상태인가

## Remaining Validation

- 실제 사용자 트래픽과 conversion analytics
- live AI 응답 품질의 장기 표본
- 외부 source별 정확도와 변경 내성
- 최신 working tree 배포 후 post-deploy UAT
