# Compare Entry Funnel Redesign Brief

## Scope

이 문서는 `Compare Entry Funnel` 재설계의 첫 kickoff brief다. 구현 범위는 아래 surface로 제한한다.

- `components/landing/CompareEntryPage.tsx`
- `components/landing/LandingCompareSearch.tsx`
- `components/product/ComparisonHighlights.tsx`
- `components/product/InfiniteProductGrid.tsx`

이 단계에서는 상세 compare core나 admin/search diagnostics는 포함하지 않는다.

## Problem Statement

현재 compare entry funnel은 기능은 충분하지만, 사용자가 아래 세 가지를 첫 화면에서 빠르게 이해하기 어렵다.

- 어떤 상품이 실제로 `compare-ready` 인지
- 최저가보다 무엇을 기준으로 비교해야 하는지
- brand/category landing -> home search -> detail compare로 이어지는 판단 흐름이 무엇인지

즉, 검색은 되지만 “비교 판단을 시작하는 화면”으로서의 hierarchy가 아직 약하다.

## Redesign Goal

이번 재설계의 목표는 시각 polish가 아니라 `purchase decision clarity` 다.

핵심 목표:

1. compare-ready signal을 검색 전/검색 직후 모두 더 빨리 보이게 한다.
2. compare lens와 실구매가 근거를 card hierarchy 안에서 더 강하게 드러낸다.
3. brand/category landing에서 home search로 넘어가는 compare intent 손실을 줄인다.
4. shortlist/favorites 재진입을 compare workflow의 일부로 보이게 만든다.

## Primary User Questions

이 funnel은 아래 질문에 즉시 답해야 한다.

- 지금 검색해도 비교 가능한 결과가 나올까?
- 어떤 카드가 generic listing이고 어떤 카드가 compare-ready 인가?
- 최저 결제가, 배송, 공식몰 여부, 검증 상태 중 무엇을 먼저 봐야 하나?
- 나중에 다시 비교하려면 어디로 돌아오면 되나?

## Current Surface Inventory

### Compare Entry Hero

`CompareEntryPage.tsx`

- breadcrumb
- eyebrow
- large title / description
- quick route chips
- `Compare Lens` side panel
- search entry block with `LandingCompareSearch`

현재 강점:

- compare intent 설명 텍스트가 이미 존재한다.
- quick route와 compare lens가 있어 정보 자산은 충분하다.

현재 약점:

- hero와 compare lens가 같은 시각 우선순위로 보여 first action이 약하다.
- search entry가 “즉시 비교 시작” CTA로 충분히 응축되지 않았다.

### Compare Routes / Proof / Re-entry

`CompareEntryPage.tsx` + `CompareShortlistSection`

- quick route cards
- compare proof section
- shortlist re-entry
- sibling navigation

현재 약점:

- proof와 route의 구분은 있지만, workflow 순서가 더 선명할 필요가 있다.
- shortlist re-entry가 보조 섹션처럼 보여 compare session continuity가 약하다.

### Search Result Entry

`InfiniteProductGrid.tsx`

- top metric cards
- `ComparisonHighlights`
- product grid
- shortlist button
- product detail modal entry

현재 강점:

- compare-ready 그룹 수, 최저 결제가, 최대 spread 등 데이터가 좋다.
- 카드 내부에 retailer trust, PDP 확인, 실구매가 근거가 이미 있다.

현재 약점:

- metric cards, highlight cards, product cards 간 hierarchy가 비슷해 보인다.
- compare-ready highlight와 일반 grid가 충분히 다른 “mode”로 느껴지지 않는다.

### Compare Highlight Cards

`ComparisonHighlights.tsx`

- match confidence
- price spread
- PDP verification count
- retailer trust
- checkout evidence

현재 약점:

- 정보는 많지만 scan hierarchy가 길다.
- “왜 눌러야 하는지”를 만드는 primary CTA energy가 부족하다.

## Design Priorities

### Priority 1: Compare Readiness Hierarchy

아래 순서를 더 강하게 보여야 한다.

1. compare-ready 여부
2. 최저 결제가 차이
3. trust / PDP / official mall 여부
4. 실구매가 근거
5. 상세 진입 CTA

### Priority 2: One Action Per Fold

첫 fold의 주행동은 하나여야 한다.

- landing: `검색으로 비교 시작`
- result context: `compare-ready 하이라이트에서 상세 진입`

### Priority 3: Re-entry Is Part Of The Funnel

shortlist/favorites는 별도 기능이 아니라 compare workflow 복귀점으로 보여야 한다.

## Non-Goals

- search ranking 변경
- AI query rewrite 변경
- compare data structure 변경
- detail page layout redesign
- admin/search learning UI 변경

## Required Design Frames

### Desktop

- compare entry landing default
- compare entry landing with quick routes emphasized
- search result with compare highlights emphasized
- search result with shortlist re-entry visible

### Mobile

- compare entry landing default
- search result with compare highlight first fold
- shortlist re-entry state

## Required Design Decisions

kickoff에서는 아래 결정을 반드시 내려야 한다.

- hero vs compare lens vs search CTA 중 무엇이 first-fold primary element인지
- compare-ready highlight card와 generic result card를 얼마나 다르게 보일지
- top metrics를 summary bar로 유지할지, highlight zone으로 흡수할지
- shortlist re-entry를 독립 section으로 둘지, hero/result context에 흡수할지

## Handoff Requirements

디자인에서 구현으로 넘어갈 때 아래 node 단위가 필요하다.

- `CompareEntry/Hero`
- `CompareEntry/CompareLens`
- `CompareEntry/SearchEntry`
- `CompareEntry/QuickRoutes`
- `CompareEntry/Proof`
- `CompareEntry/ShortlistReentry`
- `CompareEntry/SearchSummaryMetrics`
- `CompareEntry/HighlightCard`
- `CompareEntry/ResultCard`

## Validation Path

구현 후 아래로 역검증한다.

- `npm run typecheck`
- `npm run ntl:browser-smoke`
- local Playwright quick pass
- production visual baseline comparison

## Production Reference Packet

`SUN-10` 의 kickoff frame은 code-only 추측으로 만들지 않고, 아래 production artifact packet을 기준으로 시작한다.

- section-level reference summary: `output/playwright/netlify-compare-entry-surface-reference.json`
- brand hero shell: `output/playwright/compare-entry-brand-hero.png`
- brand routes shell: `output/playwright/compare-entry-brand-routes.png`
- brand shortlist re-entry shell: `output/playwright/compare-entry-brand-shortlist.png`
- search summary metrics shell: `output/playwright/compare-entry-search-summary.png`
- search highlights shell: `output/playwright/compare-entry-search-highlights.png`
- search highlight card shell: `output/playwright/compare-entry-search-highlight-card.png`
- search result card shell: `output/playwright/compare-entry-search-result-card.png`

이 packet은 `npm run ntl:compare-entry-review-prep` 한 번으로 다시 생성할 수 있고, frame hierarchy / primitive shell / shortlist continuity를 production 기준으로 맞출 때 사용하는 reference source다.

## Kickoff Prompt

```text
Redesign the LooPyck Compare Entry Funnel so users can understand compare readiness, trust, and purchase decision signals before they commit to a product detail view. Keep the current query/sort URL behavior, shortlist re-entry, and compare data semantics. Prioritize Compare Entry hero, quick routes, compare highlights, result-card hierarchy, and shortlist/favorites re-entry for both desktop and mobile.
```

## Figma Kickoff Status

- Figma file created: [LooPyck Compare Entry Funnel Redesign Kickoff](https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi)
- Current plan key: `team::1594898637194729607`
- Constraint discovered during kickoff:
  - team tier is `starter`
  - `Starter` page limit blocked the intended 4-page structure
  - subsequent `use_figma` call hit the `Figma MCP tool call limit on the Starter plan`

### Adjusted Structure For Starter Plan

자동 write가 다시 가능해지면 page structure는 아래 3-page fallback으로 압축한다.

- `Compare Entry`
- `Product Detail Compare`
- `Design System Notes`

`Shared Components` 와 `Tokens / Variables` 는 `Design System Notes` page 안의 section으로 합친다.

### Next Action When Figma Limit Clears

1. `Compare Entry` page 생성/확인
2. desktop/mobile kickoff frame 생성
3. `Product Detail Compare` placeholder page 생성
4. `Design System Notes` page에 tokens/components checklist 생성

세부 frame/section/node naming은 `docs/COMPARE_ENTRY_FUNNEL_FIGMA_MANIFEST.md` 를 기준으로 맞춘다.
실제 frame copy source와 dynamic placeholder는 `docs/COMPARE_ENTRY_FUNNEL_CONTENT_MATRIX.md` 를 기준으로 맞춘다.
reusable primitive와 code-to-Figma 매핑은 `docs/COMPARE_ENTRY_FUNNEL_COMPONENT_INVENTORY.md` 를 기준으로 맞춘다.
실제 execution 순서와 issue split은 `docs/COMPARE_ENTRY_FUNNEL_EXECUTION_PLAN.md` 를 기준으로 맞춘다.
implementation ownership과 validation split은 `docs/COMPARE_ENTRY_FUNNEL_WORK_SPLIT.md` 를 기준으로 맞춘다.
route fixture, command, artifact-level validation 기준은 `docs/COMPARE_ENTRY_FUNNEL_VALIDATION_MATRIX.md` 를 기준으로 맞춘다.
`SUN-10` 의 approved design direction gate는 `docs/COMPARE_ENTRY_FUNNEL_DESIGN_REVIEW_CHECKLIST.md` 를 기준으로 맞춘다.
frame node를 실제 file/section/owner로 내리는 translation은 `docs/COMPARE_ENTRY_FUNNEL_HANDOFF_MAP.md` 를 기준으로 맞춘다.
ticket별 edit order, PR cutline, stop point는 `docs/COMPARE_ENTRY_FUNNEL_IMPLEMENTATION_SEQUENCE.md` 를 기준으로 맞춘다.
Figma write 제한이 있을 때는 `scripts/figmaCompareEntryKickoffTemplate.mjs` 를 scaffold source로 사용한다.
production section reference artifact는 `npm run ntl:compare-entry-surfaces` 와 `output/playwright/netlify-compare-entry-surface-reference.json` 을 기준으로 확인한다.
MCP limit이 유지될 때 수동 frame 생성 순서는 `docs/COMPARE_ENTRY_FUNNEL_MANUAL_FIGMA_BUILD_CHECKLIST.md` 를 기준으로 따른다.

### Latest Retry Result

- 2026-03-26 재시도에서 `scripts/figmaCompareEntryKickoffTemplate.mjs` 기반 `use_figma` 실행을 다시 시도했지만, 동일하게 `Figma MCP tool call limit on the Starter plan` 에 막힘
- current paywall URL:
  - `https://www.figma.com/files/team/1594898637194729607/all-projects?upgrade=mcp_rate_limit_paywall`
