# Compare Entry Funnel Implementation Sequence

## Purpose

이 문서는 `SUN-10` 승인 직후 `SUN-11` 과 `SUN-12` 를 실제로 어떤 순서로 구현할지 고정한다.

이미 준비된 문서는 아래 역할을 가진다.

- brief: 무엇을 만들 것인가
- work split: 누가 어떤 file을 소유하는가
- handoff map: Figma node가 어떤 code surface로 내려오는가
- validation matrix: 무엇으로 검증하는가

이 문서는 그 위에 `edit order`, `PR cutline`, `stop point` 를 정의한다.

## Global Preconditions

아래가 모두 충족되기 전에는 구현을 시작하지 않는다.

1. `SUN-10` 이 `Approved` 또는 `Approved With Follow-up`
2. `docs/COMPARE_ENTRY_FUNNEL_DESIGN_REVIEW_CHECKLIST.md` pass
3. latest baseline 확보

baseline refresh command:

```bash
npm run ntl:compare-entry-baseline
```

## Global Guardrails

- data semantics 변경 금지
- ranking / AI rewrite 변경 금지
- detail compare core redesign 금지
- 한 ticket 안에서 다른 ticket ownership file을 넓게 수정하지 않음
- 애매하면 `app/page.tsx` 에 로직을 넣지 말고 component 내부에서 해결

## `SUN-11` Compare Entry Landing

### Recommended Edit Order

1. **Route copy freeze 확인**
   - `app/brand/[slug]/page.tsx`
   - `app/category/[slug]/page.tsx`
   - Figma copy와 route source 의미가 어긋나지 않는지 먼저 확인

2. **Hero / Compare Lens 구조 반영**
   - `components/landing/CompareEntryPage.tsx`
   - first-fold grid, hero weight, compare lens density 조정

3. **Search Entry shell 반영**
   - `components/landing/LandingCompareSearch.tsx`
   - `components/search/SearchBar.tsx`
   - input/button/sort chip hierarchy를 반영하되 query/sort semantics는 유지

4. **Quick Routes / Proof / Sibling Navigation 반영**
   - `components/landing/CompareEntryPage.tsx`
   - quick route card hierarchy, proof rhythm, sibling navigation scanability 반영

5. **Shortlist placement 최종 정리**
   - `components/landing/CompareEntryPage.tsx`
   - `CompareShortlistSection` 내부는 건드리지 않고 placement/spacing/order만 반영

### Stop Point

아래 조건이면 `SUN-11` 구현을 멈추고 scope를 다시 본다.

- `SearchBar` behavior 자체를 바꿔야 Figma를 맞출 수 있는 경우
- `CompareShortlistSection` internals 수정이 필요해 보이는 경우
- route-level copy를 바꾸지 않으면 디자인이 성립하지 않는 경우

### Required Verification Before PR

```bash
npm run typecheck
npm run ntl:compare-entry-baseline
```

그리고 quick pass 또는 수동 확인:

- `/brand/musinsa`
- `/category/sneakers`
- mobile landing fold

### PR Cutline

PR에는 아래 file만 들어가는 것이 원칙이다.

- `components/landing/CompareEntryPage.tsx`
- `components/landing/LandingCompareSearch.tsx`
- `components/search/SearchBar.tsx`
- `app/brand/[slug]/page.tsx`
- `app/category/[slug]/page.tsx`

허용 예외:

- token/class helper 수준의 very small shared style touch

## `SUN-12` Search Result Compare Hierarchy

### Recommended Edit Order

1. **Summary metric strip 반영**
   - `components/product/InfiniteProductGrid.tsx`
   - `components/product/searchResultSections.tsx`
   - `SearchSummaryMetrics` zone의 배치와 hierarchy를 먼저 반영

2. **Compare highlight zone 반영**
   - `components/product/ComparisonHighlights.tsx`
   - `components/product/compareWorkflowSections.tsx`
   - `HighlightCard` badge cluster, price focus, evidence block hierarchy 반영

3. **Generic result card hierarchy 반영**
   - `components/product/InfiniteProductGrid.tsx`
   - `components/product/searchResultSections.tsx`
   - `ResultCard` overlay, badge stack, shortlist prominence 조정

4. **Shortlist continuity 반영**
   - `components/product/CompareShortlistSection.tsx`
   - `components/product/CompareShortlistButton.tsx`
   - `components/product/compareWorkflowSections.tsx`
   - shortlist가 workflow continuity로 읽히도록 shell 정리

5. **Detail entry regression check**
   - `components/product/InfiniteProductGrid.tsx`
   - `handleGroupClick()` 과 modal entry가 그대로인지 마지막에 확인

### Stop Point

아래 조건이면 `SUN-12` 구현을 멈추고 scope를 다시 본다.

- metric meaning 자체를 바꿔야 하는 경우
- highlight/result hierarchy를 위해 grouping logic 수정이 필요한 경우
- detail compare destination을 같이 redesign 해야만 성립하는 경우

### Required Verification Before PR

```bash
npm run typecheck
npm run ntl:compare-entry-baseline
npm run ntl:release-qa-smoke
npm run ntl:favorites-probe
```

추가 확인:

- `/?q=남자%20후드&sort=sim`
- compare-ready zone first fold
- `/favorites`
- detail compare route

### PR Cutline

PR에는 아래 file만 들어가는 것이 원칙이다.

- `components/product/InfiniteProductGrid.tsx`
- `components/product/ComparisonHighlights.tsx`
- `components/product/CompareShortlistSection.tsx`
- `components/product/CompareShortlistButton.tsx`
- `components/product/searchResultSections.tsx`
- `components/product/compareWorkflowSections.tsx`

허용 예외:

- purely presentational shared helper

## `SUN-13` Validation Sequence

`SUN-11` 과 `SUN-12` 머지 후 아래 순서로만 검증한다.

```bash
npm run typecheck
npm run ntl:browser-smoke
npm run ntl:compare-entry-baseline
npm run ntl:release-qa-smoke
npm run ntl:favorites-probe
npm run ntl:auth-release-qa
```

그 다음:

```bash
$HOME/.codex/skills/playwright/scripts/playwright_cli.sh close-all
npm run ntl:quick-pass:prep
```

필요 시:

```bash
npm run ntl:real-account-qa:start
npm run ntl:real-account-qa:verify
```

## Recommended Merge Choreography

### Option A: Sequential

1. `SUN-11`
2. baseline refresh
3. `SUN-12`
4. `SUN-13`

권장 상황:

- Figma direction이 entry 쪽에서 더 큰 변화를 가질 때
- landing shell 조정이 search-result hierarchy 판단에 영향을 줄 때

### Option B: Parallel

1. `SUN-11` branch
2. `SUN-12` branch
3. 각각 ownership 경계 내에서 구현
4. `SUN-11` 먼저 merge
5. `SUN-12` rebase 후 merge
6. `SUN-13`

권장 조건:

- `docs/COMPARE_ENTRY_FUNNEL_WORK_SPLIT.md` 경계가 그대로 유지될 때
- `CompareShortlistSection` ownership split을 양쪽이 지킬 수 있을 때

## Reviewer Questions

PR review에서는 아래를 먼저 본다.

1. 이 ticket가 다른 ticket ownership file을 넘어서 수정했는가
2. query/sort semantics가 유지되는가
3. shortlist continuity가 깨지지 않는가
4. detail compare entry가 regression 없이 유지되는가
5. visual hierarchy가 Figma direction과 실제로 맞는가

## Exit Condition

이 문서의 목적은 아래 상태가 되면 달성된다.

- 구현자가 Figma 승인 직후 바로 첫 수정 파일을 결정할 수 있다
- ticket별 stop point와 PR cutline이 정해져 있다
- `SUN-13` 실행 순서가 merge 직후 흔들리지 않는다
