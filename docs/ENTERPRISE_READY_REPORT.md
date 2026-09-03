# LooPyck Architecture Readiness Notes

**Evidence date:** 2026-09-03

**Current scope:** 개인 프로젝트 / PoC 확장형 MVP

## Evidence Boundary

이 문서는 enterprise 운영 완료나 production capacity를 주장하지 않는다. 현재 저장소에서 코드와 재현 가능한 검증으로 확인되는 architecture readiness만 정리한다. 실제 사용자 수, SLA, 비용 절감률, 전환율은 측정 자료가 없어 주장 범위에서 제외한다.

## Current Architecture

- Next.js App Router 기반 검색, 비교, 상세, 즐겨찾기 UI
- source별 direct adapter와 tracked catalog fallback을 결합한 realtime aggregation
- Firebase Auth/Firestore 연동과 Firebase Admin 미설정 시 graceful degradation
- Upstash Redis rate limiting과 in-memory fallback
- Netlify primary deployment, Cloudflare Workers는 bundle-size/계정 제약으로 보류

## Reproducible Validation

```bash
npm run typecheck
npm run test:adapters
npm run build
npm run ntl:system-stress
```

`ntl:system-stress`는 local production Next server를 시작한 뒤 먼저 정적 `deployment-provenance.json`의 strict schema와 runner commit/workspace fingerprint를 검증한다. GitHub Actions에서는 manifest `runId`와 현재 `GITHUB_RUN_ID`도 일치해야 한다. 이 linkage가 통과한 경우에만 외부 provider를 호출하지 않는 네 route contract에 100개 요청을 동시에 보내며, secret-free runner identity와 build manifest를 `output/playwright/local-system-stress-smoke.json`에 함께 기록한다.

GitHub Actions의 `build-output`은 `.next/`와 `public/deployment-provenance.json`을 동일 artifact로 always-upload한다. CI self-audit는 이 두 경로의 exact set을 검사해 provenance가 빠진 불완전 build와 예상하지 않은 파일 포함을 모두 차단한다.

Dependency audit는 root full graph, `npm audit --omit=dev --json` production install graph, `tools/capacitor-assets` optional tool graph의 high/critical advisory source ID, package, severity와 vulnerable-package count를 각각 독립 baseline과 비교한다. production graph는 allowed advisory 0개와 `0 high / 0 critical` ceiling을 강제한다. 신규 advisory, severity 상승, 해석할 수 없는 transitive chain, package-count 증가를 build 전에 차단하며, 세 baseline의 review window도 각각 최대 31일로 제한한다. 결과는 workspace fingerprint와 함께 보존한다. 2026-09-03 `npm run verify:dependency-audit` 결과는 root `50 total / 15 high / 1 critical`, production `8 moderate / 0 high / 0 critical`, optional asset tool `7 total / 3 high / 1 critical`이다. tool 격리와 baseline 일치는 잔존 debt를 해결하거나 안전하다고 판정하지 않으며, 이 gate는 scope 구분과 주기적 재검토를 포함한 known-debt regression control이다.

2026-07-15 측정 결과:

- requests: `100/100` contract pass
- concurrency: `100`
- p95 latency and process-tree RSS before/peak/after: current stress artifact에 기록

이 수치는 해당 Mac의 단일 local run 결과다. production concurrent-user capacity, sustained throughput, provider API 부하, autoscaling 성능을 증명하지 않는다.

## Remaining Readiness Work

- build manifest gate를 포함한 최신 working tree 배포 후 provenance-linked 5-step UAT 실행
- 실제 트래픽 기반 latency/error-rate 장기 관찰
- live Gemini 응답 품질과 외부 source 정확도 표본 평가
- 인증 사용자 기반 favorites/alerts 운영 시나리오 반복 검증

## Safe Claim

> 다중 소스 패션 가격 비교 MVP를 구현하고, typecheck/test/build와 local production-build route stress를 재현 가능한 artifact로 관리했다.
