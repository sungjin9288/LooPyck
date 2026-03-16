# Search Learning Terminal Validation

이 문서는 production redeploy 이후 `/admin`의 search-learning terminal surface를 실제 운영 기준으로 검증할 때 쓰는 체크리스트입니다.

## 목표

- terminal surface가 기본 화면에서 정상 노출되는지 확인
- 실제 검색 신호가 `/admin` 지표로 들어오는지 확인
- `queue -> draft review -> impact` 루프가 끝까지 도는지 확인
- deep chain을 열지 않고도 terminal workflow만으로 triage가 가능한지 확인

## 사전 조건

1. 최신 `main` 기준으로 production redeploy 완료
2. Firebase 로그인 및 `/admin` 접근 가능
3. Firestore rules / indexes 배포 완료

## 확인 순서

### 1. Surface

`/admin`에서 아래 순서대로 섹션이 보이면 통과입니다.

1. `Search Learning Terminal Overview`
2. `Search Learning Terminal Validation`
3. `Search Learning Terminal Handoff`
4. `Search Learning Terminal Health`
5. `Search Learning Terminal Priorities`
6. `Search Learning Terminal Metrics`
7. `Search Learning Terminal Coverage`
8. `Search Learning Terminal Trends`
9. `Search Learning Terminal Watchlist`
10. `Search Learning Terminal Checklist`
11. `Search Learning Terminal Alerts`
12. `Search Learning Terminal Runbook`
13. `Search Learning Terminal Command Center`

기대 상태:
- `Advanced Search Learning Chain` 기본 접힘
- `Advanced Playbook Chain` 기본 접힘

### 2. Search Signals

대표 검색어로 실제 검색을 반복합니다.

- `남자 후드`
- `운동용 후드`
- `러닝 자켓`
- `트레이닝 팬츠`
- `와이드 팬츠`

기대 상태:
- 검색 결과가 정상 렌더
- `/admin`의 `Tracked Searches` 증가
- `/admin`의 `Observed Sources` 증가
- 상품 상세/비교 진입 시 `Product Opens` 증가

### 3. Learning Loop

`/admin`에서 아래 순서로 한 번 실행합니다.

1. `Search Learning Queue`
2. `Draft Review Queue`
3. `Search Learning Terminal Command Center`
4. `Search Learning Terminal Runbook`
5. `Completion Summary / Actions / Queue`

기대 상태:
- `queue 선택` 동작
- `AI 제안` 생성 가능
- `즉시 승인` 가능
- 승인 후 entry 상태와 draft 상태가 갱신

### 4. Impact

실제 검색을 다시 반복한 뒤 다음을 확인합니다.

- `Search Learning Impact`
- `Semantic Cluster Impact`
- `Search Learning Terminal Coverage`
- `Search Learning Terminal Validation`

기대 상태:
- `improved / no improvement / awaiting samples` 중 하나로 분류
- terminal validation의 `Impact Tracking`이 `pending`에서 벗어나거나, 사유가 명확히 보임

## 통과 기준

- terminal surface 전체가 기본 화면에서 노출
- 실제 검색 신호가 `/admin`에 반영
- `queue -> draft review -> impact` 루프가 실제로 동작
- terminal validation에서 `Search Signals`가 `ready`
- 운영자가 deep chain 없이 `Runbook`과 `Command Center`만으로 다음 액션을 판단 가능

## 실패 시 우선 확인

- 검색 결과가 비면: `/api/realtime-search` 응답 및 fallback mode 확인
- `/admin`이 비면: production redeploy 여부와 Firebase admin env 확인
- signal이 안 올라가면: 대표 검색어를 다시 실행하고 `Tracked Searches / Observed Sources / Product Opens` 값 확인
- impact가 계속 `pending`이면: 승인 후 실제 검색 표본이 충분히 쌓였는지 확인
