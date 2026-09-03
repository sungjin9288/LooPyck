# Development Roadmap

## 1. 현재 상태 요약

- 현재 구현 완료: direct-source 실시간 검색, 다중 소스 aggregate, 상품 그룹핑, 실구매가/배송/재고 판단, Compare Entry landing/search hierarchy, AI chat/vision/style recommendation, Firestore favorites, 가격 이력/알림 서버 로직, Netlify deploy/smoke 경로
- 개발 중: search-learning/admin diagnostics와 alert tuning 운영 품질 고도화
- 미구현: 검증된 사업 성과 수치와 production analytics 기반 개선 지표
- 검증 필요: 실제 사용자 트래픽/전환율, live Gemini 응답과 장기 대화 품질, 외부 소스별 검색·옵션 정확도
- repo 상태: 2026-09-03 기준 `main`/`origin/main`은 `6e32108`이며, working tree에는 NAVER 종료 격리, release QA artifact persistence, portfolio current-state audit, product grouping quality benchmark, search-quality observation release gate를 다루는 Phase 81~85 변경이 있다. 문서 claim은 현재 파일과 재실행 가능한 검증 명령을 기준으로 유지한다.

## 2. Phase 1 - MVP 완성

- 목표: 현재 구현된 기능을 이력서/포트폴리오에 안전하게 보여줄 수 있도록 정리
- 해야 할 작업:
  - README의 근거 없는 성과 수치를 제거하거나 검증 근거를 추가
  - 검색 -> 비교 -> 상세 -> favorites/alert demo flow 캡처
  - `npm run typecheck`와 `npm run test:adapters` 결과 정리
  - 핵심 기능별 구현 완료/개발 중/검증 필요 상태 확정
- 완료 기준:
  - README가 코드 근거와 일치
  - demo screenshot/GIF가 준비됨
  - verification command 결과가 최신 상태로 기록됨
- 산출물:
  - 수정된 README
  - demo assets
  - verification summary

## 3. Phase 2 - 기능 고도화

- 목표: 검색/비교 품질과 구매 판단 흐름을 개선
- 해야 할 작업:
  - [완료] Compare Entry funnel Figma gate와 brand/category/search result hierarchy 구현
  - [완료] 상품 grouping pairwise precision/recall/F1 평가 기준과 curated regression artifact 작성
  - [완료] source별 fallback/quality diagnostics 지표와 provenance/freshness release gate 정리
- 완료 기준:
  - `npm run ntl:compare-entry-review-ready-check` 통과
  - brand/category/search 주요 화면의 visual baseline 확보
  - 상품 비교 품질 테스트 케이스 추가
- 산출물:
  - Compare Entry approved design packet
  - updated UI implementation
  - search quality test report와 `product-grouping-quality-benchmark.{json,md}`

## 4. Phase 3 - 서비스화 / 배포

- 목표: production 운영 관점의 신뢰도를 높임
- 해야 할 작업:
  - Netlify production smoke/UAT 최신 결과 갱신
  - Firebase authorized domain/env checklist 점검
  - cron/alert scanner 운영 조건 확인
  - admin diagnostics 접근 흐름 확인
- 완료 기준:
  - Netlify smoke/UAT pass
  - 가격 알림 enabled/disabled 상태를 명확히 기록
  - 운영 env missing 시 fallback 동작 확인
- 산출물:
  - production QA report
  - env checklist
  - admin diagnostics screenshot

## 5. Phase 4 - 포트폴리오 완성

- 목표: 이력서, GitHub README, 면접 답변, 케이스 스터디에 바로 사용할 수 있는 자료 완성
- 해야 할 작업:
  - README 개선안 반영
  - project card/case study/resume bullet/interview story 최신화
  - 위험 표현 제거
  - demo link, screenshots, validation output를 포트폴리오 문서에 연결
- 완료 기준:
  - 구현 완료/개발 중/검증 필요가 문서에서 분리됨
  - 성과 수치는 실제 측정 근거가 있는 것만 포함
  - 면접에서 코드 파일을 열고 설명할 수 있음
- 산출물:
  - final portfolio packet
  - GitHub README
  - interview answer sheet

## 6. 우선순위 높은 다음 작업 5개

| 우선순위 | 작업 | 이유 | 예상 산출물 |
|---|---|---|---|
| 1 | NAVER 쇼핑 검색 종료 대응 [구현 완료, 배포 대기] | retired provider 반복 호출과 잘못된 failing health를 제거해야 함 | lifecycle contract, disabled health, regression evidence |
| 2 | production/local release evidence 재갱신 [완료] | production UAT와 dirty working-tree fingerprint evidence를 분리해 오표기 방지 | provenance-aware release QA summary |
| 3 | 핵심 demo flow 캡처 갱신 [완료] | Compare Entry와 검색 결과 hierarchy를 local QA fingerprint에 연결 | 검색/비교/상세/favorites screenshot 4개 |
| 4 | 검색 품질 지표 관찰 [local release gate 완료, production 재수집 대기] | badge cohort와 compare-ready/source health를 HOLD/CANDIDATE/WATCH 판단으로 통합하고 stale evidence 재사용 차단 | provenance-linked privacy-trimmed local/Netlify observation report |
| 5 | 포트폴리오 문서 최종 정합화 [완료] | current docs의 test count·latest commit drift를 자동 차단 | source-backed portfolio packet + current-state audit |

다음 production 변경 전 non-production 품질 기준은 완료됐다. 남은 최우선 작업은 Phase 81~85 release candidate의 명시적 commit/push/deploy 승인과 배포 후 NAVER disabled/log 무호출 및 search-quality observation 재수집이다.
