# Compare Entry Funnel Handoff Map

## Purpose

이 문서는 Figma frame/node가 실제 코드의 어느 file, section, prop, data source로 내려가는지 고정한다.

목표는 두 가지다.

- `SUN-11` / `SUN-12` 구현자가 Figma node 이름만 보고 바로 edit surface를 찾게 한다.
- visual redesign 중 data semantics, route copy injection, shortlist behavior를 잘못 건드리지 않게 막는다.

## Handoff Rule

- node naming source는 `docs/COMPARE_ENTRY_FUNNEL_FIGMA_MANIFEST.md`
- reusable primitive intent는 `docs/COMPARE_ENTRY_FUNNEL_COMPONENT_INVENTORY.md`
- file ownership은 `docs/COMPARE_ENTRY_FUNNEL_WORK_SPLIT.md`

이 문서는 위 세 문서의 translation layer다.

## Route-Level Data Injection

### Brand Entry Route

- route: `/brand/musinsa`
- source file: `app/brand/[slug]/page.tsx`
- owner: `SUN-11`
- injected props:
  - `quickRoutes`
  - `decisionSignals`
  - `proofPoints`
  - `siblingLinks`
  - `title`
  - `description`
  - `starterQuery`

주의:

- route 파일은 copy/data source를 소유한다
- visual shell은 `CompareEntryPage.tsx` 에서 해결한다
- route 파일에서 search-result hierarchy를 건드리지 않는다

### Category Entry Route

- route: `/category/sneakers`
- source file: `app/category/[slug]/page.tsx`
- owner: `SUN-11`
- injected props는 brand route와 동일한 shape

주의:

- copy 의미는 category source를 유지하고, shell만 공통 language로 맞춘다

## Entry Surface Node Mapping

### `CompareEntry/Hero`

- source file: `components/landing/CompareEntryPage.tsx`
- owner: `SUN-11`
- current content:
  - breadcrumb
  - eyebrow
  - title
  - description
  - hero quick-route chips

likely edit surface:

- hero grid ratio
- title/description spacing
- chip emphasis
- accent blur/background treatment

do not change:

- route-level title/description meaning
- `buildSearchHref()` semantics

### `CompareEntry/CompareLens`

- source file: `components/landing/CompareEntryPage.tsx`
- owner: `SUN-11`
- data source: `decisionSignals`

likely edit surface:

- signal row density
- label/value contrast
- border/divider treatment
- desktop vs mobile placement

do not change:

- signal count and meaning without route copy update
- search CTA behavior

### `CompareEntry/SearchEntry`

- source files:
  - `components/landing/CompareEntryPage.tsx`
  - `components/landing/LandingCompareSearch.tsx`
  - `components/search/SearchBar.tsx`
- owner: `SUN-11`

sub-mapping:

- `CompareEntry/SearchEntry/Heading`
  - `CompareEntryPage.tsx`
- `CompareEntry/SearchEntry/SearchBar`
  - `LandingCompareSearch.tsx`
  - `SearchBar.tsx`
- `CompareEntry/SearchEntry/PrimaryCTA`
  - `SearchBar.tsx`

likely edit surface:

- heading/copy layout
- input/button emphasis
- sort chip density
- visual search affordance placement

do not change:

- `handleSearch()` URL construction in `LandingCompareSearch.tsx`
- query normalization / feedback / suggestion behavior in `SearchBar.tsx`
- `sort=sim|asc|dsc` semantics

### `CompareEntry/QuickRoutes`

- source file: `components/landing/CompareEntryPage.tsx`
- owner: `SUN-11`
- data source: `quickRoutes`

sub-mapping:

- `CompareEntry/QuickRouteChip`
  - hero chip row in `CompareEntryPage.tsx`
- `CompareEntry/QuickRouteCard`
  - compare routes grid in `CompareEntryPage.tsx`

likely edit surface:

- chip/card visual distinction
- route card density
- card CTA prominence

do not change:

- `query` and `sort` payload for route cards

### `CompareEntry/Proof`

- source file: `components/landing/CompareEntryPage.tsx`
- owner: `SUN-11`
- data source: `proofPoints`

likely edit surface:

- section header shell
- proof card rhythm
- proof vs shortlist ordering

### `CompareEntry/ShortlistReentry`

- source files:
  - placement/order: `components/landing/CompareEntryPage.tsx`
  - component internals: `components/product/CompareShortlistSection.tsx`
- owner:
  - section placement: `SUN-11`
  - component internals: `SUN-12`

likely edit surface:

- landing 내 section 순서와 spacing
- shortlist card shell, count pill, CTA visual weight

do not change:

- shortlist local persistence
- compare deep-link behavior
- remove/clear action semantics

### `CompareEntry/SiblingNavigation`

- source file: `components/landing/CompareEntryPage.tsx`
- owner: `SUN-11`
- data source: `siblingLinks`

likely edit surface:

- card grouping
- relation hint text
- navigation scanability

## Search Result Surface Node Mapping

### `CompareEntry/SearchSummaryMetrics`

- source files:
  - metric calculation / placement: `components/product/InfiniteProductGrid.tsx`
  - visual shell: `components/product/searchResultSections.tsx`
- owner: `SUN-12`
- source metrics:
  - `lowestVisiblePrice`
  - `comparisonReadyGroups.length`
  - `biggestSpread`

likely edit surface:

- 3-card strip hierarchy
- label/value/helper text relationship
- placement relative to highlight zone

do not change:

- metric meaning
- calculation logic

### `CompareEntry/HighlightCard`

- source files:
  - data assembly / click wiring: `components/product/ComparisonHighlights.tsx`
  - visual shell: `components/product/compareWorkflowSections.tsx`
- owner: `SUN-12`
- source data:
  - `group.mallCount`
  - `group.matchConfidence`
  - `metrics.lowestCheckoutPrice`
  - `checkoutEvidence`
  - `bestCaseEvidence`
  - retailer trust label

likely edit surface:

- badge cluster hierarchy
- image-to-text ratio
- price focus row
- evidence block treatment
- compare CTA energy

do not change:

- `onProductClick(group)` behavior
- purchase metric semantics
- retailer trust labeling logic

### `CompareEntry/ResultCard`

- source files:
  - group enrichment / modal wiring: `components/product/InfiniteProductGrid.tsx`
  - visual shell: `components/product/searchResultSections.tsx`
- owner: `SUN-12`
- subparts:
  - `ResultCard/TrustBadge`
  - mall compare badge
  - PDP badge
  - shortlist action
  - overlay price/meta

likely edit surface:

- overlay hierarchy
- badge stack treatment
- shortlist button prominence
- grid rhythm and density

do not change:

- `handleGroupClick()` detail/modal entry
- `buildFavoriteProductFromUnified()` payload
- product enrichment and grouping logic

### `CompareEntry/ShortlistButton`

- source files:
  - toggle behavior / notifications / haptics: `components/product/CompareShortlistButton.tsx`
  - visual shell: `components/product/compareWorkflowSections.tsx`
- owner: `SUN-12`

likely edit surface:

- compact/default variant shell
- saved state emphasis

do not change:

- toggle behavior
- notification meaning
- haptic trigger semantics

### `CompareEntry/DetailEntryHint`

- source files:
  - actual entry behavior: `components/product/InfiniteProductGrid.tsx`
  - destination surface: `components/product/ProductDetailModal.tsx`
- owner:
  - hint styling / context: `SUN-12`
  - detail core layout: frozen, not in scope

주의:

- detail compare destination은 regression target일 뿐 redesign target이 아니다

## Primitive-to-File Map

| Primitive | Primary file | Owner |
|---|---|---|
| `CompareEntry/SectionHeader` | `components/landing/CompareEntryPage.tsx`, `components/product/ComparisonHighlights.tsx` | split by ticket |
| `CompareEntry/HeroTextStack` | `components/landing/CompareEntryPage.tsx` | `SUN-11` |
| `CompareEntry/SignalRow` | `components/landing/CompareEntryPage.tsx` | `SUN-11` |
| `CompareEntry/SearchEntryShell` | `components/landing/LandingCompareSearch.tsx`, `components/search/SearchBar.tsx` | `SUN-11` |
| `CompareEntry/QuickRouteCard` | `components/landing/CompareEntryPage.tsx` | `SUN-11` |
| `CompareEntry/SummaryMetricCard` | `components/product/searchResultSections.tsx` | `SUN-12` |
| `CompareEntry/HighlightCard` | `components/product/compareWorkflowSections.tsx` | `SUN-12` |
| `CompareEntry/ResultCard` | `components/product/searchResultSections.tsx` | `SUN-12` |
| `CompareEntry/ShortlistSection` | `components/product/CompareShortlistSection.tsx`, `components/product/compareWorkflowSections.tsx` | `SUN-12` |
| `CompareEntry/ShortlistButton` | `components/product/CompareShortlistButton.tsx`, `components/product/compareWorkflowSections.tsx` | `SUN-12` |

## Coordination Surfaces

### `app/page.tsx`

- role: home search orchestration only
- allowed change:
  - minimal wiring for approved redesign rollout
- do not use for:
  - major visual hierarchy work
  - search-result card redesign logic

### `components/product/ProductDetailModal.tsx`

- role: regression target only
- redesign scope: excluded

### `lib/search/*` and `lib/product/*`

- role: data semantics / calculation layer
- redesign scope: excluded

## Exit Condition

이 문서의 목적은 아래 상태가 되면 달성된다.

- Figma frame의 node 이름을 보고 바로 code owner를 찾을 수 있다
- `SUN-11` 과 `SUN-12` 가 file 충돌 없이 병렬 착수 가능하다
- visual redesign 중 data semantics 변경을 건드리지 않는 경계가 분명하다
