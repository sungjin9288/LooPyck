# Compare Entry Funnel Work Split

## Purpose

이 문서는 `SUN-11` 과 `SUN-12` 가 Figma direction 승인 직후 바로 구현에 들어갈 수 있도록 file ownership, shared invariant, verification ownership을 고정한다.

핵심 목표는 두 가지다.

- landing hierarchy 변경과 search-result hierarchy 변경이 같은 파일을 두고 충돌하지 않게 한다.
- visual redesign 범위가 data semantics, ranking logic, detail compare flow까지 번지지 않게 막는다.

## Prerequisite

- `SUN-10` 에서 approved Figma direction이 먼저 나와야 한다.
- 이 문서는 implementation split 기준이며, design direction 자체를 대체하지 않는다.

## Ownership Summary

### `SUN-11` Compare Entry Landing

소유 범위:

- `components/landing/CompareEntryPage.tsx`
- `components/landing/LandingCompareSearch.tsx`
- `components/search/SearchBar.tsx`
- `app/brand/[slug]/page.tsx`
- `app/category/[slug]/page.tsx`

허용 변경:

- hero, compare lens, search CTA의 first-fold hierarchy 재배치
- quick route card density, emphasis, spacing 조정
- brand/category route copy injection 구조 정리
- landing/mobile stacked layout 정리
- `SearchBar` 의 visual shell 조정

비허용 변경:

- search result metric shell, highlight zone, generic result card hierarchy 변경
- `ComparisonHighlights.tsx` / `InfiniteProductGrid.tsx` 내부 정보 구조 변경
- shortlist data contract, detail deep-link, compare data semantics 변경
- search ranking, query rewrite, grouped product logic 변경

### `SUN-12` Search Result Compare Hierarchy

소유 범위:

- `components/product/ComparisonHighlights.tsx`
- `components/product/InfiniteProductGrid.tsx`
- `components/product/CompareShortlistButton.tsx`
- `components/product/CompareShortlistSection.tsx`
- `components/product/searchResultSections.tsx`
- `components/product/compareWorkflowSections.tsx`

허용 변경:

- compare-ready highlight zone 우선순위 재정렬
- summary metrics / highlight card / generic result card hierarchy 차별화
- shortlist re-entry visual continuity 강화
- trust / PDP / checkout evidence scanability 개선

비허용 변경:

- brand/category landing hero hierarchy 변경
- `LandingCompareSearch.tsx` / `SearchBar.tsx` 의 entry CTA copy/behavior 변경
- compare data contract, price calculation, matching logic, modal/detail entry semantics 변경
- `ProductDetailModal` 과 `/product/[id]` layout redesign 착수

## Shared Touchpoints

### `CompareShortlistSection`

- component internals와 card styling은 `SUN-12` 소유다.
- `SUN-11` 은 landing 안에서 이 section의 placement, surrounding spacing, section order만 조정할 수 있다.
- shortlist storage behavior, deep-link behavior, CTA meaning은 어느 ticket에서도 바꾸지 않는다.

### `SearchBar`

- `SearchBar` visual shell은 `SUN-11` 소유다.
- `SUN-12` 는 result hierarchy 작업 중 `SearchBar` 를 수정하지 않는다.
- query normalization, blocked-query feedback, sort selection behavior는 유지한다.

### `app/page.tsx`

- home search page는 coordination surface다.
- `SUN-11` 과 `SUN-12` 모두 `app/page.tsx` 를 직접 대규모 수정하지 않는다.
- approved design을 연결하기 위한 최소 wiring change만 허용하며, layout ownership은 해당 component 내부에서 해결한다.

## Frozen Surfaces

아래 영역은 이번 Compare Entry redesign ticket에서 건드리지 않는다.

- `components/product/ProductDetailModal.tsx`
- `app/product/[id]/page.tsx`
- `components/product/VariantScopedCompareSections.tsx`
- `lib/search/*`
- `lib/product/*`
- `hooks/useMultiSourceSearch.ts`
- `hooks/useGroupedProducts.ts`
- admin / search diagnostics surfaces

detail compare redesign는 별도 track으로 유지한다.

## Shared Invariants

두 ticket 모두 아래 invariant를 유지해야 한다.

1. `/?q=...&sort=...` URL semantics는 그대로 유지한다.
2. `sort=sim|asc|dsc` behavior와 restore flow를 깨지 않는다.
3. compare-ready 판정 기준, grouped product composition, ranking/AI rewrite는 변경하지 않는다.
4. shortlist add/remove, local persistence, deep-link re-entry semantics를 유지한다.
5. detail modal / compare page 진입점과 CTA meaning을 유지한다.
6. brand/category copy source는 route file에서 계속 주입하고, content matrix source를 벗어나지 않는다.
7. visual redesign과 data semantics 변경을 한 ticket에 섞지 않는다.

## Validation Ownership

### `SUN-11`

필수 확인:

- `/brand/musinsa`
- `/category/sneakers`
- mobile landing fold
- landing search CTA -> `/?q=...&sort=...` roundtrip

기본 검증:

- `npm run typecheck`
- landing screenshot diff or capture

### `SUN-12`

필수 확인:

- `/?q=남자%20후드&sort=sim`
- compare-ready highlight zone
- shortlist re-entry section
- detail modal entry intact

기본 검증:

- `npm run typecheck`
- relevant search-result screenshot diff or capture

### `SUN-13`

최종 통합 검증:

- `SUN-11` + `SUN-12` 머지 후 local quick pass
- browser smoke / visual baseline refresh
- brand/category/home search compare entry continuity 확인

## Merge Order

1. `SUN-10` approved Figma direction 확보
2. `SUN-11` landing implementation
3. `SUN-12` search-result hierarchy implementation
4. `SUN-13` validation and regression closure

`SUN-11` 과 `SUN-12` 를 truly parallel 로 진행하려면 둘 다 이 문서의 ownership 경계를 지켜야 한다.

## Escalation Rule

구현 도중 아래 상황이 나오면 ticket 안에서 우회하지 말고 경계를 다시 조정한다.

- `SearchBar` 와 result metric shell을 동시에 바꿔야 하는 design dependency가 생김
- shortlist component를 두 surface에서 서로 다른 behavior로 갈라야 함
- detail compare surface를 같이 손대야 visual hierarchy가 성립함
- ranking/data semantics를 바꾸지 않으면 design intent가 성립하지 않음

이 경우는 redesign scope drift 신호로 보고 `SUN-10` 또는 follow-up ticket으로 분리한다.
