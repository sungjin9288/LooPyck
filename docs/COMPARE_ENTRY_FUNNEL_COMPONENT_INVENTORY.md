# Compare Entry Funnel Component Inventory

## Purpose

이 문서는 `Compare Entry Funnel` redesign kickoff에서 Figma로 옮겨야 할 reusable primitive를 코드 기준으로 정리한다.

목표는 두 가지다.

1. Figma frame을 그릴 때 어떤 shell을 공통 컴포넌트로 분리할지 빠르게 판단
2. 이후 code implementation 시 Figma node와 실제 React surface를 1:1로 연결

## Source Components

- `components/landing/CompareEntryPage.tsx`
- `components/landing/LandingCompareSearch.tsx`
- `components/search/SearchBar.tsx`
- `components/product/ComparisonHighlights.tsx`
- `components/product/InfiniteProductGrid.tsx`
- `components/product/CompareShortlistButton.tsx`
- `components/product/CompareShortlistSection.tsx`

## Reusable Primitive Set

### 1. Section Header Pair

code pattern:

- small uppercase eyebrow
- large bold section title
- right-side supporting description

source:

- `CompareEntryPage.tsx` routes/proof/sibling section header
- `ComparisonHighlights.tsx` section header

Figma candidate:

- `CompareEntry/SectionHeader`

variants:

- `withDescription`
- `withPill`
- `simple`

### 2. Hero Eyebrow + Headline Stack

code pattern:

- eyebrow: `text-xs`, uppercase, wide tracking
- headline: `text-4xl`~`text-6xl`, `font-black`
- supporting paragraph: `text-base`~`text-lg`

source:

- `CompareEntryPage.tsx` hero block

Figma candidate:

- `CompareEntry/HeroTextStack`

### 3. Compare Lens Signal Row

code pattern:

- label in muted uppercase
- value in stronger body copy
- repeated divided rows

source:

- `CompareEntryPage.tsx` compare lens block

Figma candidate:

- `CompareEntry/SignalRow`

### 4. Search Entry Shell

code pattern:

- heading + supporting copy
- search bar field
- visual search affordance
- primary search CTA
- sort chips

source:

- `LandingCompareSearch.tsx`
- `SearchBar.tsx`

Figma candidate:

- `CompareEntry/SearchEntryShell`
- nested:
  - `CompareEntry/SearchField`
  - `CompareEntry/SortChip`
  - `CompareEntry/PrimarySearchButton`

### 5. Quick Route Chip

code pattern:

- rounded full pill
- thin border
- white translucent surface

source:

- `CompareEntryPage.tsx` hero quick route chip

Figma candidate:

- `CompareEntry/QuickRouteChip`

### 6. Quick Route Card

code pattern:

- rounded `2rem`
- top accent bar
- note / title / query / CTA copy

source:

- `CompareEntryPage.tsx` compare routes grid

Figma candidate:

- `CompareEntry/QuickRouteCard`

### 7. Summary Metric Card

code pattern:

- label
- large numeric value
- short helper text

source:

- `InfiniteProductGrid.tsx` summary metric 3-card strip

Figma candidate:

- `CompareEntry/SummaryMetricCard`

variants:

- `lowestCheckout`
- `compareReady`
- `priceSpread`

### 8. Compare Highlight Card

code pattern:

- media top
- compare count
- badge cluster
- title
- trust/meta pills
- price focus row
- evidence block

source:

- `ComparisonHighlights.tsx`

Figma candidate:

- `CompareEntry/HighlightCard`

subparts:

- `HighlightCard/BadgeCluster`
- `HighlightCard/TrustPill`
- `HighlightCard/PriceFocus`
- `HighlightCard/EvidenceBlock`

### 9. Search Result Card

code pattern:

- edge-to-edge image
- overlay badges
- overlay price/meta content
- shortlist icon/button

source:

- `InfiniteProductGrid.tsx`

Figma candidate:

- `CompareEntry/ResultCard`

subparts:

- `ResultCard/TrustBadge`
- `ResultCard/MallCompareBadge`
- `ResultCard/PdpBadge`
- `ResultCard/ShortlistButton`
- `ResultCard/OverlayPrice`

### 10. Shortlist Summary Shell

code pattern:

- soft white container
- summary copy + count pill + clear action
- list of saved candidate cards

source:

- `CompareShortlistSection.tsx`

Figma candidate:

- `CompareEntry/ShortlistSection`
- `CompareEntry/ShortlistSummary`
- `CompareEntry/ShortlistItemCard`

### 11. Shortlist Toggle Button

code pattern:

- compact rounded pill
- neutral / saved variant

source:

- `CompareShortlistButton.tsx`

Figma candidate:

- `CompareEntry/ShortlistButton`

variants:

- `default`
- `saved`
- `compact`

## Visual Token Hints

현재 코드에서 반복되는 시각 토큰은 아래 성격으로 보인다.

### Color Families

- base surface: `slate-50`, `white`, `white/70`, `white/80`, `white/85`, `slate-100`
- border: `slate-200`, `slate-300`
- primary text: `slate-950`, `slate-900`
- secondary text: `slate-600`, `slate-500`, `slate-400`
- trust/signal accents:
  - `sky`
  - `emerald`
  - `violet`
  - `fuchsia`

### Radius Families

- chip/button: `full`
- input/button shell: `2xl`
- card shell: `3xl`
- feature card shell: `2rem`

### Shadow Families

- base: `shadow-sm`
- elevated card: `shadow-lg`
- CTA/button emphasis: `shadow-md` -> `shadow-xl`

### Type Hierarchy

- eyebrow: `text-xs`, uppercase, `tracking-[0.18em]` ~ `tracking-[0.22em]`
- section title: `text-2xl` / `text-3xl`, `font-black`
- hero title: `text-4xl` -> `text-6xl`, `font-black`
- helper body: `text-sm` / `text-base`, `leading-6`~`leading-7`
- number emphasis: `text-2xl` / `text-3xl`, `font-black`

## Redesign Reuse Guidance

### Keep As Stable Semantic Components

아래는 redesign 이후에도 semantic meaning이 유지돼야 한다.

- `QuickRouteCard`
- `SummaryMetricCard`
- `HighlightCard`
- `ResultCard`
- `ShortlistItemCard`
- `ShortlistButton`

### Allow Higher Visual Divergence

아래는 구조는 유지하되 visual language는 더 크게 바뀌어도 된다.

- hero background treatment
- compare lens layout
- search entry shell
- proof section treatment
- sibling navigation treatment

### Do Not Merge

아래는 시각적으로 가까워져도 separate component로 유지한다.

- `HighlightCard` vs `ResultCard`
- `QuickRouteChip` vs `SortChip`
- `ShortlistButton` vs primary CTA
- `SummaryMetricCard` vs proof card

## Code-to-Figma Mapping

### Compare Entry Page

- `CompareEntryPage.tsx`
  - `HeroTextStack`
  - `QuickRouteChip`
  - `SignalRow`
  - `QuickRouteCard`
  - `ShortlistSection`
  - `SectionHeader`

### Search Entry

- `SearchBar.tsx`
  - `SearchEntryShell`
  - `SearchField`
  - `SortChip`
  - `PrimarySearchButton`

### Search Result

- `ComparisonHighlights.tsx`
  - `HighlightCard`
  - `BadgeCluster`
  - `EvidenceBlock`
- `InfiniteProductGrid.tsx`
  - `SummaryMetricCard`
  - `ResultCard`

### Re-entry

- `CompareShortlistSection.tsx`
  - `ShortlistSummary`
  - `ShortlistItemCard`
- `CompareShortlistButton.tsx`
  - `ShortlistButton`

## Design System Notes Page Checklist

Figma의 `Design System Notes` page에는 최소 아래 항목이 있어야 한다.

- `SectionHeader`
- `HeroTextStack`
- `SignalRow`
- `QuickRouteChip`
- `QuickRouteCard`
- `SearchEntryShell`
- `SortChip`
- `PrimarySearchButton`
- `SummaryMetricCard`
- `HighlightCard`
- `ResultCard`
- `ShortlistSection`
- `ShortlistItemCard`
- `ShortlistButton`

## Review Questions

- 같은 의미를 가진 shell이 frame마다 다르게 그려지고 있지 않은가
- `HighlightCard` 와 `ResultCard` 의 역할 차이가 충분히 보이는가
- `ShortlistButton` 이 generic CTA처럼 보이지 않고 re-entry affordance로 읽히는가
- hero/search/summary/highlight 사이의 hierarchy가 component 수준에서도 일관적인가
