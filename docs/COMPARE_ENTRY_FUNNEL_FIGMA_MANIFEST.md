# Compare Entry Funnel Figma Frame Manifest

## Purpose

이 문서는 `Compare Entry Funnel` 재설계 kickoff를 Figma에서 바로 시작할 수 있도록 frame 이름, source route, section hierarchy, content invariants를 고정한다.

자동 `Figma MCP` scaffolding이 `Starter` plan 제한으로 멈춘 상태이므로, 이 문서는 후속 수동 작업 또는 limit 해제 후 재실행을 위한 실행 명세다.

## Source Routes

### Brand Compare Entry

- route: `/brand/musinsa`
- source file: `app/brand/[slug]/page.tsx`
- page wrapper: `components/landing/CompareEntryPage.tsx`

### Category Compare Entry

- route: `/category/sneakers`
- source file: `app/category/[slug]/page.tsx`
- page wrapper: `components/landing/CompareEntryPage.tsx`

### Home Search Result

- route: `/?q=남자%20후드&sort=sim`
- source file: `components/product/InfiniteProductGrid.tsx`
- highlight surface: `components/product/ComparisonHighlights.tsx`

## Reference Artifacts

현재 production reference artifact는 아래를 기준으로 쓴다.

- [`output/playwright/brand.png`](/Users/sungjin/dev/personal/LooPyck/output/playwright/brand.png)
- [`output/playwright/category.png`](/Users/sungjin/dev/personal/LooPyck/output/playwright/category.png)
- [`output/playwright/search-results-longwait.png`](/Users/sungjin/dev/personal/LooPyck/output/playwright/search-results-longwait.png)

현재 확인된 desktop reference size:

- `1440 x 1400`

mobile frame은 [`docs/COMPARE_DETAIL_REDESIGN_KICKOFF.md`](/Users/sungjin/dev/personal/LooPyck/docs/COMPARE_DETAIL_REDESIGN_KICKOFF.md#L100) 기준 width `393px` 로 시작한다.

## Page Structure

Starter plan fallback 구조:

1. `Compare Entry`
2. `Product Detail Compare`
3. `Design System Notes`

이 manifest는 `Compare Entry` page 내부 frame만 정의한다.

## Required Frames

### Desktop Frames

1. `CompareEntry/Desktop/Brand-Musinsa`
2. `CompareEntry/Desktop/Category-Sneakers`
3. `CompareEntry/Desktop/Search-Results-Hood`

### Mobile Frames

1. `CompareEntry/Mobile/Brand-Musinsa`
2. `CompareEntry/Mobile/Category-Sneakers`
3. `CompareEntry/Mobile/Search-Results-Hood`

## Frame Sizing Rules

### Desktop

- width: `1440`
- height: hug content
- top-level wrapper name: `CompareEntry/Desktop/*`

### Mobile

- width: `393`
- height: hug content
- top-level wrapper name: `CompareEntry/Mobile/*`

## Section Hierarchy

모든 frame은 아래 section order를 유지한다.

### Entry Frames

`Brand-Musinsa`, `Category-Sneakers`

1. `TopNav/Context`
2. `Hero`
3. `CompareLens`
4. `SearchEntry`
5. `QuickRoutes`
6. `ShortlistReentry`
7. `CompareProof`
8. `SiblingNavigation`

### Search Result Frame

`Search-Results-Hood`

1. `SearchSummaryMetrics`
2. `CompareHighlights`
3. `ResultGrid`
4. `ShortlistEntry`
5. `DetailEntryHint`

## Section-Level Node Names

Figma node 이름은 아래를 그대로 쓴다.

### Entry Hero Zone

- `CompareEntry/Hero`
- `CompareEntry/Hero/Breadcrumb`
- `CompareEntry/Hero/Title`
- `CompareEntry/Hero/Description`
- `CompareEntry/Hero/QuickRouteChips`

### Compare Lens

- `CompareEntry/CompareLens`
- `CompareEntry/CompareLens/Signal-1`
- `CompareEntry/CompareLens/Signal-2`
- `CompareEntry/CompareLens/Signal-3`

### Search Entry

- `CompareEntry/SearchEntry`
- `CompareEntry/SearchEntry/Heading`
- `CompareEntry/SearchEntry/SearchBar`
- `CompareEntry/SearchEntry/PrimaryCTA`

### Quick Routes / Proof / Re-entry

- `CompareEntry/QuickRoutes`
- `CompareEntry/QuickRouteCard`
- `CompareEntry/ShortlistReentry`
- `CompareEntry/Proof`
- `CompareEntry/ProofCard`
- `CompareEntry/SiblingNavigation`

### Search Result Surface

- `CompareEntry/SearchSummaryMetrics`
- `CompareEntry/SearchSummaryMetricCard`
- `CompareEntry/HighlightCard`
- `CompareEntry/ResultCard`
- `CompareEntry/ResultCard/TrustBadge`
- `CompareEntry/ResultCard/CheckoutEvidence`

## Content Invariants

재설계 중에도 아래 의미는 유지한다.

### Brand Entry

- `eyebrow`: `Brand Compare Entry`
- title 형식: `무신사 비교 시작`
- starter query: brand tag 1개 사용
- compare lens는 `우선 보는 기준`, `분리해서 봐야 하는 경우`, `이 페이지의 역할` 3개 signal 유지

### Category Entry

- `eyebrow`: `Category Compare Entry`
- title 형식: `이모지 + 카테고리명 + 비교 시작`
- compare lens는 `카테고리 진입에서 중요한 것`, `바로 확인할 비교 축`, `이 페이지의 역할` 3개 signal 유지

### Search Results

- summary metric 3개 유지
  - `최저 결제가`
  - `비교 가능 상품`
  - `최대 결제가 차이`
- compare-ready highlight와 generic result grid는 분리된 zone으로 유지
- result card에는 아래 신호가 남아 있어야 한다.
  - mall count
  - retailer trust
  - PDP 확인 여부
  - lowest checkout price
  - checkout evidence
  - shortlist action

## Visual Priority Rules

이 manifest는 아래 hierarchy를 전제로 한다.

1. primary compare CTA
2. compare-ready signal
3. spread / 실구매가 근거
4. trust / PDP / official mall
5. re-entry

즉, `Hero -> SearchEntry -> HighlightCard` 흐름이 첫 시선에서 읽혀야 한다.

## Desktop/Mobile Differences

### Desktop

- hero와 compare lens를 같은 fold 안에 두되, primary action은 search entry에 집중
- quick route grid는 3-column까지 허용
- highlight cards는 3-column 기준

### Mobile

- compare lens는 hero 아래 stacked block으로 전환
- quick routes는 1-column card stack 또는 horizontal chip strip
- highlight cards는 first fold에서 1개씩 scan 가능한 vertical card
- shortlist re-entry는 독립 section이 아니라 sticky re-entry affordance 후보로도 검토

## First Manual Figma Construction Order

Figma limit이 풀리거나 수동 작업을 시작할 때는 아래 순서만 따른다.

1. `Compare Entry` page 생성 또는 선택
2. desktop 3 frame 생성
3. mobile 3 frame 생성
4. `CompareEntry/Hero`, `CompareEntry/CompareLens`, `CompareEntry/SearchEntry` skeleton 생성
5. `CompareEntry/HighlightCard` 와 `CompareEntry/ResultCard` shell 생성
6. `Design System Notes` page에 token/component checklist 추가

## Verification After Figma Kickoff

frame 생성 후 아래를 확인한다.

- frame 이름이 manifest와 일치하는지
- desktop/mobile width가 맞는지
- Brand/Category/Home Search 3개 source route가 모두 반영됐는지
- `CompareEntry/HighlightCard` 와 `CompareEntry/ResultCard` 가 별도 node로 분리됐는지
- shortlist re-entry가 entry funnel의 일부로 포함됐는지
