# LooPyck Walkthrough

**Current status:** MVP 구현 후 검증·운영 고도화 중

**Evidence date:** 2026-09-03

## Product Flow

1. 홈/brand/category Compare Entry에서 검색 의도를 입력한다.
2. realtime aggregation이 direct source와 fallback 결과를 수집한다.
3. 검색 결과가 compare-ready highlight와 일반 결과 hierarchy로 정리된다.
4. 상세 화면에서 옵션, 배송, 재고, 실구매가, 가격 이력을 비교한다.
5. favorites와 가격 알림으로 후보를 다시 확인한다.

## Current Verification

```bash
npm run typecheck
npm run test:adapters
npm run verify:grouping-quality
npm run build
npm run ntl:search-quality-report -- http://localhost:3100
npm run ntl:system-stress
```

- Compare Entry Figma review gate: `READY`
- adapter/domain tests: `543/543` pass
- product grouping benchmark: curated products `12`, evaluated pairs `66`, pairwise precision/recall/F1 `100%`
- local system stress: served build manifest와 runner/CI run identity linkage 후 production build route contracts `100/100` pass at concurrency `100`
- CI build artifact: `.next/`와 generated provenance manifest를 exact bundle로 always-upload
- release closeout report: local QA, screenshots, direct-source, system-stress, search-quality observation fingerprint/freshness 상태 확인

## Evidence

- `output/playwright/release-closeout-report.md`
- `output/playwright/local-release-qa-summary.json`
- `output/playwright/local-direct-source-integration-smoke.json`
- `output/playwright/local-system-stress-smoke.json`
- `output/playwright/local-search-quality-observation-report.md`
- `output/playwright/product-grouping-quality-benchmark.md`
- `docs/implementation-evidence.md`

## Limitations

- local stress는 manifest-linked production build의 네 deterministic route contract 단일 실행이며 production concurrent-user capacity가 아니다.
- grouping benchmark는 curated fixture regression이며 production matching accuracy나 conversion 성과가 아니다.
- search-quality cohort status는 directional observation이며 statistical significance나 인과 성과가 아니다.
- 운영 사용자 수, 전환율, 비용 절감률, SLA는 측정 자료가 없다.
- live Gemini 품질과 외부 source 정확도는 지속적인 표본 검증이 필요하다.
- 최신 working tree의 production promotion은 commit/push/deploy 지시 전까지 보류한다.
