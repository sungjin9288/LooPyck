# Compare Entry Funnel Execution Plan

## Goal

`Compare Entry Funnel` 재설계를 실제 실행 단계로 옮기기 위한 구현 순서, ticket 경계, acceptance criteria를 정의한다.

이 계획은 아래 준비 문서를 구현 순서로 연결한다.

- `docs/COMPARE_DETAIL_REDESIGN_KICKOFF.md`
- `docs/COMPARE_ENTRY_FUNNEL_REDESIGN_BRIEF.md`
- `docs/COMPARE_ENTRY_FUNNEL_FIGMA_MANIFEST.md`
- `docs/COMPARE_ENTRY_FUNNEL_CONTENT_MATRIX.md`
- `docs/COMPARE_ENTRY_FUNNEL_COMPONENT_INVENTORY.md`
- `docs/COMPARE_ENTRY_FUNNEL_MANUAL_FIGMA_BUILD_CHECKLIST.md`
- `docs/COMPARE_ENTRY_FUNNEL_WORK_SPLIT.md`
- `docs/COMPARE_ENTRY_FUNNEL_VALIDATION_MATRIX.md`
- `docs/COMPARE_ENTRY_FUNNEL_DESIGN_REVIEW_CHECKLIST.md`
- `docs/COMPARE_ENTRY_FUNNEL_HANDOFF_MAP.md`
- `docs/COMPARE_ENTRY_FUNNEL_IMPLEMENTATION_SEQUENCE.md`

## Delivery Tracks

## Current Delivery Status

이 계획은 `Figma-first` 순서를 유지한 상태로 완료됐다.

- `SUN-10` 은 build `84/84`, review `35/35`, decision `Approved With Follow-up`으로 승인됐다.
- 현재 gate는 `output/playwright/compare-entry-review-gate.json` 기준 `READY`, bundle은 `output/playwright/compare-entry-review-artifact-audit.json` 기준 `READY`, active blocker는 `none`이다.
- `SUN-11` landing implementation, `SUN-12` search-result hierarchy, `SUN-13` validation/release closure까지 완료됐다.
- Figma quota 대응과 manual worksheet 절차는 재발 시 사용하는 historical recovery path이며 현재 실행 작업이 아니다.

### Track 1. Figma Kickoff Build

목적:

- Compare Entry redesign의 desktop/mobile frame을 실제 Figma frame으로 만든다.
- reusable primitive를 `Design System Notes` 에 정리한다.

scope:

- kickoff file: `https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi`
- `Compare Entry` page
- `Product Detail Compare` placeholder page
- `Design System Notes` page

deliverables:

- desktop 3 frame
- mobile 3 frame
- `HighlightCard`, `ResultCard`, `SummaryMetricCard`, `ShortlistButton` primitive draft
- executable scaffold template: `scripts/figmaCompareEntryKickoffTemplate.mjs`
- production section reference packet linked from `npm run ntl:compare-entry-surfaces`
- single-command review prep runner: `npm run ntl:compare-entry-review-prep`
- manual-build packet artifact: `npm run ntl:compare-entry-manual-figma-packet`

acceptance:

- frame naming이 manifest와 일치
- copy source가 content matrix와 일치
- `HighlightCard` 와 `ResultCard` 가 별도 component shell로 존재
- production reference packet 기준 hero/routes/shortlist/search shell 대응이 확인된다
- `approved design direction` gate는 `docs/COMPARE_ENTRY_FUNNEL_DESIGN_REVIEW_CHECKLIST.md` 를 따른다

historical blockers and resolution:

- Figma Starter plan page/tool-call limit 때문에 초기 MCP 생성이 차단됐다.
- `docs/COMPARE_ENTRY_FUNNEL_MANUAL_FIGMA_BUILD_CHECKLIST.md` 의 수동 fallback과 desktop Plugin API build로 6개 frame을 완료했다.
- 보호된 manual evidence는 `CompareEntry/Mobile/Brand-Musinsa` frame `14:2`, `TopNav/Context` section `14:3`이며 현재 gate에서 재검증된다.

### Track 2. Compare Entry Landing Implementation

목적:

- brand/category compare entry hero, compare lens, search entry, quick route hierarchy를 실제 코드에 반영한다.

scope:

- `components/landing/CompareEntryPage.tsx`
- `components/landing/LandingCompareSearch.tsx`
- `components/search/SearchBar.tsx`
- `app/brand/[slug]/page.tsx`
- `app/category/[slug]/page.tsx`

deliverables:

- first-fold hierarchy 재정렬
- hero/search CTA 우선순위 강화
- compare lens 시각적 hierarchy 재정렬
- mobile stacked layout 정리

acceptance:

- landing에서 primary CTA가 하나로 읽힘
- brand/category entry가 같은 design language로 정렬
- query/sort URL behavior 유지

### Track 3. Search Result Compare Hierarchy Implementation

목적:

- compare-ready highlight와 generic result grid의 시각 hierarchy를 더 명확히 나눈다.

scope:

- `components/product/ComparisonHighlights.tsx`
- `components/product/InfiniteProductGrid.tsx`
- `components/product/CompareShortlistButton.tsx`
- `components/product/CompareShortlistSection.tsx`

deliverables:

- summary metric shell 재배치
- `HighlightCard` 강조
- `ResultCard` generic grid와의 hierarchy 차별화
- shortlist re-entry 흐름 강화

acceptance:

- compare-ready zone이 generic browsing보다 앞에 보임
- trust / PDP / evidence block scanability 개선
- shortlist re-entry가 workflow continuity로 보임

### Track 4. Validation and Release Closure

목적:

- redesign가 실제 funnel behavior를 깨지 않았는지 검증한다.

scope:

- local type/build verification
- Playwright smoke/UAT
- visual baseline refresh

deliverables:

- updated screenshot baseline
- quick-pass manual review
- regression summary

acceptance:

- `npm run typecheck`
- relevant build/smoke commands pass
- brand/category/home compare entry surface가 회귀 없이 확인
- shortlist re-entry와 detail entry flow 유지

## Suggested Issue Split

1. `design`: build Compare Entry Funnel kickoff frames and shared primitives in Figma
2. `feat`: implement Compare Entry landing redesign from approved Figma direction
3. `feat`: implement Compare Entry search-result hierarchy redesign
4. `test`: validate Compare Entry redesign with visual baseline and Playwright UAT

## Implementation Order

1. Track 1 완료
2. Track 2 구현
3. Track 3 구현
4. Track 4 검증

이번 delivery는 위 순서로 완료됐다. 후속 comparable redesign에서도 Figma direction이 없는 상태에서 implementation을 먼저 시작하지 않는다.
`npm run ntl:compare-entry-review-ready-check` 가 exit code `0` 이 되기 전에는 새 Track 2/3 implementation으로 이동하지 않는다.

## Guardrails

- compare data contract 변경 금지
- search ranking/AI rewrite 로직 변경 금지
- detail compare core redesign는 별도 track으로 유지
- visual redesign과 data semantics 변경을 한 PR에 섞지 않음
- `SUN-11` / `SUN-12` file ownership과 shared invariant는 `docs/COMPARE_ENTRY_FUNNEL_WORK_SPLIT.md` 를 따른다
- `SUN-10` 승인 전에는 `SUN-11` / `SUN-12` 관련 visual code를 새로 시작하지 않는다
- implementation phase 진입 조건은 `ready-check = 0` 하나로 고정한다

## Verification Map

### Code Verification

- `npm run typecheck`
- 필요한 경우 `npm run build`

### Browser Verification

- `npm run ntl:browser-smoke`
- local Playwright quick pass
- route/command/artifact 기준은 `docs/COMPARE_ENTRY_FUNNEL_VALIDATION_MATRIX.md` 를 따른다

### Visual Verification

- brand entry screenshot
- category entry screenshot
- search result screenshot

## Exit Condition

이 계획은 아래 상태가 되면 목적을 달성한다.

- execution ticket가 backlog에 생성됨
- 각 ticket 경계가 중복 없이 정의됨
- `SUN-10` 이 `ready-check` 통과로 unblock 됨
- 그 다음 실제 작업이 `SUN-11` implementation track으로 자연스럽게 이어질 수 있음
