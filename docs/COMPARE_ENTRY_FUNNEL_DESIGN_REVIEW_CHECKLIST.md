# Compare Entry Funnel Design Review Checklist

## Purpose

이 문서는 `SUN-10` 에서 Figma kickoff frame이 준비된 뒤, 어떤 조건을 만족해야 `approved design direction` 으로 간주하고 `SUN-11` / `SUN-12` 를 시작할 수 있는지 고정한다.

이 checklist는 visual taste review가 아니라 implementation handoff gate다.

## Review Scope

검토 대상은 아래 frame으로 제한한다.

- `CompareEntry/Desktop/Brand-Musinsa`
- `CompareEntry/Desktop/Category-Sneakers`
- `CompareEntry/Desktop/Search-Results-Hood`
- `CompareEntry/Mobile/Brand-Musinsa`
- `CompareEntry/Mobile/Category-Sneakers`
- `CompareEntry/Mobile/Search-Results-Hood`

node naming, content source, primitive shell은 아래 문서를 함께 본다.

- `docs/COMPARE_ENTRY_FUNNEL_FIGMA_MANIFEST.md`
- `docs/COMPARE_ENTRY_FUNNEL_CONTENT_MATRIX.md`
- `docs/COMPARE_ENTRY_FUNNEL_COMPONENT_INVENTORY.md`

review 전에 아래 production reference packet도 같이 연다.

- `output/playwright/netlify-compare-entry-surface-reference.json`
- `output/playwright/compare-entry-brand-hero.png`
- `output/playwright/compare-entry-brand-routes.png`
- `output/playwright/compare-entry-brand-shortlist.png`
- `output/playwright/compare-entry-search-summary.png`
- `output/playwright/compare-entry-search-highlights.png`
- `output/playwright/compare-entry-search-highlight-card.png`
- `output/playwright/compare-entry-search-result-card.png`

이 artifact packet은 `npm run ntl:compare-entry-review-prep` 한 번으로 다시 생성할 수 있다.
직접 나눠 실행하려면 `npm run ntl:compare-entry-surfaces` 후 `npm run ntl:compare-entry-review-packet` 순서를 사용한다.
review 기록지를 같이 만들려면 `npm run ntl:compare-entry-review-worksheet` 또는 prep runner를 사용하고, 결과는 `output/playwright/compare-entry-design-review-worksheet.md` 에 저장한다.
review decision 기록을 남기려면 `npm run ntl:compare-entry-review-decision-log` 또는 prep runner를 사용하고, 결과는 `output/playwright/compare-entry-design-review-decision-log.md` 에 저장한다.
한 화면에서 section artifact를 바로 보고 싶으면 `npm run ntl:compare-entry-review-board` 또는 prep runner를 사용하고, 결과는 `output/playwright/compare-entry-design-review-board.html` 에 저장한다.
review session snapshot을 남기려면 `npm run ntl:compare-entry-review-archive` 또는 prep runner를 사용하고, 결과는 `output/playwright/compare-entry-review-sessions/<timestamp>/` 아래에 저장된다.
archive 목록을 훑으려면 `npm run ntl:compare-entry-review-archive-index` 또는 prep runner를 사용하고, 결과는 `output/playwright/compare-entry-review-sessions/index.html` 에 저장된다.
manual build single-screen packet도 prep runner에 포함되며, 결과는 `output/playwright/compare-entry-manual-figma-packet.html` 에 저장된다.
manual build frame-by-frame spec sheet도 prep runner에 포함되며, 결과는 `output/playwright/compare-entry-manual-frame-specs.md` 에 저장된다.

## Approval Rule

아래 5개 섹션이 모두 pass여야 `SUN-10` 을 done으로 보고 `SUN-11` / `SUN-12` 를 unblock 한다.

1. frame completeness
2. hierarchy clarity
3. content fidelity
4. component readiness
5. implementation handoff safety

하나라도 fail이면 `approved direction` 으로 보지 않는다.

## 1. Frame Completeness

### Must Pass

- desktop 3 frame과 mobile 3 frame이 모두 존재한다
- frame naming이 manifest와 일치한다
- entry frame에는 `Hero`, `CompareLens`, `SearchEntry`, `QuickRoutes`, `ShortlistReentry`, `CompareProof`, `SiblingNavigation` 이 모두 있다
- search-result frame에는 `SearchSummaryMetrics`, `CompareHighlights`, `ResultGrid`, `ShortlistEntry`, `DetailEntryHint` 가 모두 있다

### Fail Conditions

- desktop/mobile 한쪽만 있고 다른 쪽이 placeholder 수준에 머문다
- frame 이름이 implementation handoff와 다르게 임의로 바뀐다
- shortlist re-entry 또는 compare highlight zone이 누락된다
- production reference packet에 있는 핵심 section shell이 frame 안에서 대응되지 않는다

## 2. Hierarchy Clarity

### Entry Frames

아래 질문에 첫 fold 안에서 답해야 한다.

- 지금 비교를 시작하는 행동이 무엇인지 보이는가
- compare lens가 설명 보조인지, primary CTA인지 혼동되지 않는가
- quick routes가 hero보다 먼저 읽히지 않는가

### Search Result Frame

아래 질문에 첫 scan 안에서 답해야 한다.

- compare-ready zone이 generic browsing보다 앞에 읽히는가
- `HighlightCard` 와 `ResultCard` 가 다른 mode로 느껴지는가
- shortlist re-entry가 side utility가 아니라 workflow continuity로 읽히는가

### Fail Conditions

- hero / compare lens / search CTA 가 비슷한 weight로 경쟁한다
- result metric strip, highlight card, generic card가 같은 priority로 읽힌다
- primary CTA가 둘 이상으로 보인다

## 3. Content Fidelity

### Must Match

- brand/category eyebrow, title format, compare lens signal meaning이 content matrix와 맞는다
- summary metric label은 `최저 결제가`, `비교 가능 상품`, `최대 결제가 차이` 의미를 유지한다
- shortlist 관련 copy가 compare re-entry 의미를 유지한다
- search-result frame이 `남자 후드` compare flow를 설명하는 방향과 어긋나지 않는다

### Allowed Flexibility

- exact microcopy length 조정
- CTA wording polish
- helper text 축약

### Fail Conditions

- route file이 주입하는 의미와 다른 headline/copy를 만든다
- shortlist를 wishlist 성격으로 오해하게 만든다
- compare-ready / trust / checkout evidence 의미가 시각적으로 누락된다
- production reference packet이 보여주는 metric/highlight/result shell 의미가 다른 direction으로 바뀐다

## 4. Component Readiness

### Must Pass

- `CompareEntry/Hero`
- `CompareEntry/CompareLens`
- `CompareEntry/SearchEntry`
- `CompareEntry/QuickRouteCard`
- `CompareEntry/SectionHeader`
- `CompareEntry/SummaryMetricCard`
- `CompareEntry/HighlightCard`
- `CompareEntry/ResultCard`
- `CompareEntry/ShortlistReentry`

위 shell이 frame 안에서 identifiable 하게 분리되어 있다.

### Fail Conditions

- frame은 예쁘지만 reusable primitive 경계가 보이지 않는다
- `HighlightCard` 와 `ResultCard` 가 node 수준에서 분리되지 않는다
- implementation에서 어떤 file/component가 어떤 frame section을 받아야 하는지 추적이 어렵다

## 5. Implementation Handoff Safety

### Must Pass

- `SUN-11` 과 `SUN-12` 로 ownership split 가능한 경계가 보인다
- query/sort semantics를 깨지 않고 구현할 수 있다
- shortlist placement 변경과 shortlist behavior 변경이 분리되어 있다
- detail compare core redesign 없이도 visual intent를 구현할 수 있다

### Fail Conditions

- design intent를 구현하려면 ranking/data semantics 변경이 필요해 보인다
- entry/search-result redesign가 같은 component를 크게 공유해서 work split이 붕괴된다
- detail page redesign 없이는 compare-entry 방향성이 성립하지 않는다

## Review Questions

승인 전에 아래 질문에 모두 `yes` 여야 한다.

1. 첫 fold에서 사용자가 해야 할 행동이 하나로 읽히는가
2. compare-ready card와 generic result card를 한눈에 구분할 수 있는가
3. shortlist가 “나중에 비교 이어보기” 의미로 유지되는가
4. route-specific copy를 현재 source file 주입 구조로 유지할 수 있는가
5. `SUN-11` 과 `SUN-12` 가 서로 같은 파일을 두고 충돌하지 않고 구현 가능한가

## Review Outcome Labels

### `Approved`

- `SUN-10` done
- `SUN-11` / `SUN-12` unblock

### `Approved With Follow-up`

- implementation 시작은 가능
- minor copy polish 또는 token cleanup은 follow-up note로 분리

### `Needs Revision`

- frame 또는 hierarchy를 다시 손봐야 함
- `SUN-10` 유지

## Recommended Review Sequence

1. desktop brand frame
2. desktop category frame
3. desktop search-result frame
4. production reference packet과 section 대응 관계 확인
5. mobile brand/category first fold
6. mobile search-result first fold
7. primitive shell / node naming 확인
8. ownership split / handoff feasibility 최종 확인

## Exit Condition

아래 상태가 되면 `SUN-10` 을 닫는다.

- desktop/mobile 6 frame complete
- hierarchy clarity pass
- content matrix fidelity pass
- primitive shell pass
- handoff safety pass
- blocker note 없이 `SUN-11` / `SUN-12` start 가능
