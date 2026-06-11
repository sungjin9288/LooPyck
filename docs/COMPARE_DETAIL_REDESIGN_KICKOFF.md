# Compare/Detail Redesign Kickoff Guardrails

## Goal

이 문서는 `compare funnel` 과 `product detail compare` 재설계가 실제로 시작될 때만 `Figma MCP` 를 제한적으로 도입하기 위한 entry criteria, surface priority, handoff contract를 고정한다.

범위는 준비 단계까지만 포함한다. 이 문서는 실제 UI redesign 구현 문서가 아니다.

## Entry Criteria

아래 조건이 모두 충족될 때만 `Figma MCP` 를 재설계 workflow에 투입한다.

- release closure가 끝나 있어야 한다.
  - web release QA 종료
  - Android emulator native smoke 종료
  - local Playwright MCP quick-pass reset/prep workaround 정리 완료
- compare/detail의 데이터 계약이 안정화돼 있어야 한다.
  - query/sort URL sync 유지
  - compare deep-link (`/product/[id]` + source/variant context) 유지
  - shortlist/favorites re-entry 흐름 유지
- active `P1` runtime blocker가 없어야 한다.
- redesign 목표가 시각 polish 수준이 아니라 사용자 판단 품질 개선으로 명시돼 있어야 한다.
  - 예: “어디서 사야 하는지 더 빨리 판단”
  - 예: “가격/배송/재고/옵션 신뢰도를 첫 화면에서 이해”

위 조건이 하나라도 빠지면 `Figma MCP` 는 도입하지 않고 기존 code-first 운영을 유지한다.

## First Design-Led Surfaces

재설계는 아래 순서로만 시작한다.

### 1. Compare Entry Funnel

첫 kickoff 대상은 compare intent가 형성되는 구간이다.

- `components/landing/CompareEntryPage.tsx`
- `components/landing/LandingCompareSearch.tsx`
- `components/product/ComparisonHighlights.tsx`
- `components/product/InfiniteProductGrid.tsx`

목표:

- 사용자가 “무엇이 비교 가능한지”를 검색 전에도 이해할 수 있어야 한다.
- compare-ready product와 generic listing의 차이가 카드 단계에서 드러나야 한다.
- brand/category landing에서 home search로 넘어갈 때 intent 손실이 없어야 한다.

### 2. Product Detail Compare Core

두 번째 kickoff 대상은 실제 구매 판단이 일어나는 상세 compare core다.

- `app/product/[id]/page.tsx`
- `components/product/ProductDetailModal.tsx`
- `components/product/VariantScopedCompareSections.tsx`
- `components/product/PurchaseDecisionBlock.tsx`
- `components/product/PurchaseComparisonTable.tsx`
- `components/product/PriceHistoryChart.tsx`

목표:

- 최저가 정보보다 “실구매 판단”이 먼저 보이게 한다.
- 옵션/사이즈/재고/배송/공식몰 여부/가격 이력을 하나의 decision hierarchy로 정리한다.
- compare intro, decision block, mall table, price history의 우선순위를 시각적으로 명확히 만든다.

### 3. Trust / Re-entry Support

세 번째 대상은 compare session 복귀와 신뢰 신호를 보강하는 보조 surface다.

- `components/product/CompareShortlistSection.tsx`
- `components/product/CompareShortlistButton.tsx`
- `/favorites` compare link entry

목표:

- guest와 authenticated user 모두 compare 흐름을 잃지 않게 한다.
- shortlist/favorites에서 detail compare로 이어지는 복귀 동선을 단순화한다.

## Non-Goals

kickoff 단계에서 아래 항목은 제외한다.

- admin/search diagnostics redesign
- search learning terminal UI overhaul
- native shell layout redesign
- scraping/search ranking logic 변경
- Firestore schema 또는 compare data contract 변경

데이터 구조를 바꾸는 작업은 별도 implementation track으로 분리한다.

## Required Figma Assets At Kickoff

kickoff 시점에는 아래 산출물이 있어야 한다.

### Figma File Structure

- `Page 1: Compare Entry`
- `Page 2: Product Detail Compare`
- `Page 3: Shared Components`
- `Page 4: Tokens / Variables`

### Required Frames

- Desktop `1440px`
- Mobile `393px` 또는 팀 표준 handset width

각 surface는 최소 다음 frame을 포함해야 한다.

- compare entry default
- compare entry with search results context
- product detail compare default
- product detail compare with multiple offers
- shortlist/favorites re-entry state

### Required Components / Tokens

- compare card shell
- trust badge / freshness badge
- decision block row
- mall offer row
- price history card shell
- shortlist/re-entry CTA
- spacing/color/typography variables

## Node Scope Rules

`Figma MCP` 는 kickoff 이후에도 전체 파일을 한 번에 구현하지 않는다.

- 한 번에 하나의 page 또는 1~3개 node group만 다룬다.
- node 이름은 역할 중심으로 고정한다.
  - `CompareEntry/Hero`
  - `CompareEntry/ResultCard`
  - `ProductDetail/DecisionBlock`
  - `ProductDetail/MallCompareTable`
  - `ProductDetail/PriceHistory`
- exploratory frame, scratch frame, abandoned variant는 implementation scope에 넣지 않는다.

## Handoff Contract

디자인에서 구현으로 넘어갈 때는 아래 input이 있어야 한다.

### Design Input

- Figma file URL
- 정확한 node ID 목록
- desktop/mobile 우선순위
- 변경 목적 한 줄
  - 예: “compare-ready trust hierarchy 개선”
  - 예: “decision block first fold 집중”

### MCP Workflow

1. `search_design_system` 으로 재사용 가능한 component/token 확인
2. `get_design_context` 로 node별 screenshot/code context 수집
3. 필요한 경우에만 `use_figma` 또는 code connect workflow 사용
4. code 구현은 surface 단위로 나눠서 진행
5. 구현 후 production smoke / release QA checklist로 역검증

### Implementation Guardrails

- compare data semantics는 유지한다.
- query/sort URL sync를 깨지 않는다.
- detail deep-link, shortlist, favorites compare entry를 깨지 않는다.
- visual redesign과 ranking/AI logic 변경을 한 PR에 섞지 않는다.

## Kickoff Checklist

### Before Kickoff

- [ ] redesign 목적이 문장 하나로 고정됨
- [ ] first surface가 Compare Entry 또는 Product Detail Compare 중 하나로 좁혀짐
- [ ] current production screenshot baseline 확보됨
- [ ] target file/node scope가 확정됨

### During Kickoff

- [ ] desktop/mobile frame 확인
- [ ] shared tokens/component 재사용 여부 확인
- [ ] trust/freshness/decision hierarchy가 디자인 안에 포함됨
- [ ] shortlist/favorites re-entry 영향 여부 확인

### Before Implementation Starts

- [ ] Figma URL + node IDs 전달 완료
- [ ] implementation surface order 확정
- [ ] non-goal 범위 재확인
- [ ] smoke / QA verification path 연결 완료

## Suggested Kickoff Prompt

아래 프롬프트를 시작점으로 사용한다.

```text
Kick off a compare/detail redesign for LooPyck focused on purchase decision clarity, trust signaling, and compare re-entry. Start with Compare Entry or Product Detail Compare only. Preserve existing query/sort URL behavior, detail deep-link semantics, shortlist/favorites re-entry, and current compare data contracts. Provide desktop and mobile frames, shared component/tokens, and explicit node scopes for implementation handoff.
```

## Exit Criteria

이 문서는 아래 상태가 되면 목적을 달성한 것으로 본다.

- `Figma MCP` 를 언제 도입하는지 팀이 합의할 수 있다.
- 첫 redesign 대상 surface가 명확하다.
- design-to-code handoff에서 필요한 file/node/verification path가 명확하다.
