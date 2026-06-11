# Development Roadmap

## 1. 현재 상태 요약

- 현재 구현 완료: 검색 API, 다중 소스 aggregate, 상품 그룹핑, 실구매가/배송/재고 판단, AI chat/vision/style recommendation, Firestore favorites, 가격 이력/알림 서버 로직, Netlify deploy/smoke 문서
- 개발 중: Compare Entry funnel redesign, search-learning/admin diagnostics 고도화, alert tuning 운영 흐름
- 미구현: 검증된 성과 수치, production analytics 기반 개선 지표, README 코드 근거 중심 재작성
- 검증 필요: 최신 배포 상태, 핵심 사용자 흐름 스크린샷, AI 추천 품질, 외부 소스별 검색 정확도
- repo 상태: 최신 커밋은 `e036792`(2026-03-18)이고, 2026-06-09 현재 워킹트리에 다수의 미커밋 변경이 있다. 따라서 Phase 1에서는 기능 추가보다 문서/검증/커밋 단위 정리가 우선이다.

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
  - Compare Entry funnel Figma gate 완료
  - brand/category/search result hierarchy 구현
  - 상품 grouping precision/recall 평가 기준 작성
  - source별 fallback/quality diagnostics 지표 정리
- 완료 기준:
  - `npm run ntl:compare-entry-review-ready-check` 통과
  - brand/category/search 주요 화면의 visual baseline 확보
  - 상품 비교 품질 테스트 케이스 추가
- 산출물:
  - Compare Entry approved design packet
  - updated UI implementation
  - search quality test report

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
| 1 | README 위험 표현 정리 | 이력서/포트폴리오 신뢰도를 가장 크게 좌우함 | 코드 근거 중심 README |
| 2 | 핵심 demo flow 캡처 | 면접/README에서 실제 동작을 보여줘야 함 | 검색/비교/상세/favorites screenshot |
| 3 | `npm run typecheck`와 `npm run test:adapters` 최신 실행 | 문서 claim을 검증 결과와 연결해야 함 | verification summary |
| 4 | Compare Entry gate unblock | 현재 redesign 구현 진입 조건이 gate에 묶여 있음 | approved review gate artifact |
| 5 | 검색 품질 지표 정의 | “검색 품질 개선”을 수치 없이 말하기 어려움 | source quality matrix |
