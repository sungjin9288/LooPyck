# Compare Entry Funnel Validation Matrix

## Purpose

이 문서는 `SUN-11`, `SUN-12`, `SUN-13` 에서 Compare Entry redesign를 검증할 때 route, command, artifact, pass/fail 기준을 고정한다.

목표는 세 가지다.

- ticket별로 어떤 화면을 어디까지 확인해야 하는지 흔들리지 않게 한다.
- 결과 개수처럼 변동 가능한 지표와 blocker 신호를 분리한다.
- `SUN-13` 에서 기존 release QA loop를 그대로 재사용할 수 있게 한다.

## Fixed Validation Inputs

### Routes

- brand entry: `/brand/musinsa`
- category entry: `/category/sneakers`
- home search result: `/?q=남자%20후드&sort=sim`
- favorites: `/favorites`
- detail compare: `ntl:release-qa-smoke` 또는 `ntl:favorites-probe` 가 resolve 하는 production detail route

### Search Query Fixture

- primary query: `남자 후드`
- secondary query for smoke only: `운동용 후드`

### Shared Invariants

- `q` 와 `sort` 는 URL, search input, rendered state에서 일치해야 한다.
- compare-ready/data semantics는 redesign 중에도 변하지 않아야 한다.
- shortlist persistence, favorites compare click-through, detail entry semantics는 유지되어야 한다.
- admin terminal은 이번 redesign scope 밖이므로 regression 확인 대상에서 제외한다.
- `npm run ntl:compare-entry-review-ready-check` 가 통과하기 전에는 `SUN-11` / `SUN-12` 구현을 시작하지 않는다.
- 현재 manual review 시작 순서는 `Brand-Musinsa -> CompareEntry/Desktop/Brand-Musinsa -> TopNav/Context` 로 고정한다.

## Existing Reference Artifacts

아래 artifact는 redesign 이전 baseline reference로 계속 사용한다.

- public brand baseline: `output/playwright/brand.png`
- public category baseline: `output/playwright/category.png`
- public search baseline: `output/playwright/search-results-longwait.png`
- compare entry brand hero reference: `output/playwright/compare-entry-brand-hero.png`
- compare entry brand routes reference: `output/playwright/compare-entry-brand-routes.png`
- compare entry brand shortlist reference: `output/playwright/compare-entry-brand-shortlist.png`
- compare entry search summary reference: `output/playwright/compare-entry-search-summary.png`
- compare entry search highlights reference: `output/playwright/compare-entry-search-highlights.png`
- compare entry search highlight card reference: `output/playwright/compare-entry-search-highlight-card.png`
- compare entry search result card reference: `output/playwright/compare-entry-search-result-card.png`
- compare entry surface reference summary: `output/playwright/netlify-compare-entry-surface-reference.json`
- compare entry design review packet: `output/playwright/compare-entry-design-review-packet.md`
- compare entry design review worksheet: `output/playwright/compare-entry-design-review-worksheet.md`
- compare entry design review decision log: `output/playwright/compare-entry-design-review-decision-log.md`
- compare entry design review board: `output/playwright/compare-entry-design-review-board.html`
- compare entry review status board: `output/playwright/compare-entry-review-status-board.html`
- compare entry review status json: `output/playwright/compare-entry-review-status.json`
- compare entry review missing detail: `output/playwright/compare-entry-review-missing-detail.md`
- compare entry review missing detail json: `output/playwright/compare-entry-review-missing-detail.json`
- compare entry review focus plan: `output/playwright/compare-entry-review-focus-plan.md`
- compare entry review focus plan json: `output/playwright/compare-entry-review-focus-plan.json`
- compare entry review frame progress board: `output/playwright/compare-entry-review-frame-progress-board.html`
- compare entry review frame progress board json: `output/playwright/compare-entry-review-frame-progress-board.json`
- compare entry review section progress board html: `output/playwright/compare-entry-review-section-progress-board.html`
- compare entry review section progress board markdown: `output/playwright/compare-entry-review-section-progress-board.md`
- compare entry review section progress board json: `output/playwright/compare-entry-review-section-progress-board.json`
- compare entry review surface queue html: `output/playwright/compare-entry-review-surface-queue.html`
- compare entry review surface queue markdown: `output/playwright/compare-entry-review-surface-queue.md`
- compare entry review surface queue json: `output/playwright/compare-entry-review-surface-queue.json`
- compare entry review surface status board html: `output/playwright/compare-entry-review-surface-status-board.html`
- compare entry review surface status board markdown: `output/playwright/compare-entry-review-surface-status-board.md`
- compare entry review surface status board json: `output/playwright/compare-entry-review-surface-status-board.json`
- compare entry review next surface packet html: `output/playwright/compare-entry-review-next-surface-packet.html`
- compare entry review next surface packet markdown: `output/playwright/compare-entry-review-next-surface-packet.md`
- compare entry review next surface packet json: `output/playwright/compare-entry-review-next-surface-packet.json`
- compare entry review next surface section packet html: `output/playwright/compare-entry-review-next-surface-section-packet.html`
- compare entry review next surface section packet markdown: `output/playwright/compare-entry-review-next-surface-section-packet.md`
- compare entry review next surface section packet json: `output/playwright/compare-entry-review-next-surface-section-packet.json`
- compare entry review next surface checklist html: `output/playwright/compare-entry-review-next-surface-checklist.html`
- compare entry review next surface checklist markdown: `output/playwright/compare-entry-review-next-surface-checklist.md`
- compare entry review next surface checklist json: `output/playwright/compare-entry-review-next-surface-checklist.json`
- compare entry review next section action card html: `output/playwright/compare-entry-review-next-section-action-card.html`
- compare entry review next section action card markdown: `output/playwright/compare-entry-review-next-section-action-card.md`
- compare entry review next section action card json: `output/playwright/compare-entry-review-next-section-action-card.json`
- compare entry review next frame packet html: `output/playwright/compare-entry-review-next-frame-packet.html`
- compare entry review next frame packet markdown: `output/playwright/compare-entry-review-next-frame-packet.md`
- compare entry review next frame packet json: `output/playwright/compare-entry-review-next-frame-packet.json`
- compare entry review next section packet html: `output/playwright/compare-entry-review-next-section-packet.html`
- compare entry review next section packet markdown: `output/playwright/compare-entry-review-next-section-packet.md`
- compare entry review next section packet json: `output/playwright/compare-entry-review-next-section-packet.json`
- compare entry review closeout draft: `output/playwright/compare-entry-review-closeout-draft.md`
- compare entry review closeout json: `output/playwright/compare-entry-review-closeout-draft.json`
- compare entry review gate: `output/playwright/compare-entry-review-gate.md`
- compare entry review gate json: `output/playwright/compare-entry-review-gate.json`
- compare entry review delta: `output/playwright/compare-entry-review-delta.md`
- compare entry review delta json: `output/playwright/compare-entry-review-delta.json`
- compare entry review artifact audit: `output/playwright/compare-entry-review-artifact-audit.md`
- compare entry review artifact audit json: `output/playwright/compare-entry-review-artifact-audit.json`
- compare entry review evidence summary: `output/playwright/compare-entry-review-evidence-summary.md`
- compare entry review evidence summary json: `output/playwright/compare-entry-review-evidence-summary.json`
- latest session manifest should include archived `compare-entry-review-artifact-audit.{md,json}`
- compare entry linear update draft: `output/playwright/compare-entry-linear-update-draft.md`
- compare entry linear update text: `output/playwright/compare-entry-linear-update-draft.txt`
- compare entry linear update json: `output/playwright/compare-entry-linear-update-draft.json`
- compare entry approval board: `output/playwright/compare-entry-approval-board.html`
- compare entry approval board json: `output/playwright/compare-entry-approval-board.json`
- approval board는 `artifact audit + latest-handoff JSON link + archive index JSON link + top blocked surfaces + top blocked sections + top blocked frames + closeout/Linear draft`를 함께 노출해야 한다
- closeout draft / Linear update draft / approval board 는 `surface status` 기준 `blockedSurfaceCount`, `readySurfaceCount`, `recommendedNextSurface`, `recommendedNextSurfaceFrameCount`, `recommendedNextSurfaceSectionCount`, `recommendedNextSurfaceSectionPreview`, `recommendedNextSurfaceChecklistPath`, `recommendedNextSurfaceChecklistFirstFrame`, `recommendedNextSurfaceChecklistFirstSection`, `recommendedNextSectionActionCardPath`, `recommendedNextSectionActionFirstItem`, `top blocked sections` 를 함께 유지해야 한다
- review status board 는 `recommendedNextSurface`, `recommendedNextFrame`, `recommendedNextSection`, `recommendedNextSurfaceChecklistPath`, `recommendedNextSectionActionCardPath`, `recommendedNextSectionActionFirstItem` 를 함께 유지해야 한다
- artifact audit 는 root artifact, `index.json`, `latest-handoff.json`, latest archived session 안의 `activeBlocker` identity(`kind`, `target`, `latestStatus`, `latestOperation`, `latestTool`)가 gate와 일치하는지 검사하고 `activeBlockerMismatchCount` 를 summary에 노출해야 한다
- review gate 와 approval board 는 artifact audit summary(`missingCount`, `activeBlockerMismatchCount`, `activeBlockerFilesChecked`, `activeBlockerFieldsChecked`)를 직접 보존해야 한다
- latest handoff 와 archive index 는 artifact audit summary(`artifactAuditState`, `activeBlockerMismatchCount`, `activeBlockerFilesChecked`)를 상위 navigation view에 직접 표시해야 하며, latest handoff에는 archive `index.json` link를, archive index 상단에는 `latest-handoff.{html,md,json}` stable quick link와 `index.json` self-link를 노출하고 `index.json` 에도 같은 session summary를 보존해야 한다
- evidence summary 는 gate, artifact audit, approval board, latest handoff, archive index JSON을 한 번에 읽어 `gateState`, `activeBlocker`, audit summary, operator links, validation command checklist를 machine-readable 형태로 보존해야 한다
- ready-check blocked/passed output 은 `artifactAuditState`, `activeBlockerMismatchCount`, `activeBlockerFilesChecked` 를 gate summary와 함께 출력해야 한다
- focus plan 은 gate의 `activeBlocker` 를 유지하고 blocker가 `none` 이 아니면 첫 `topActions` 항목을 `kind: active-blocker`, `priority: 0` 으로 노출해야 한다
- surface status board 는 `activeBlocker`, `recommendedNextSurface`, `recommendedNextFrame`, `recommendedNextSection`, `recommendedNextSurfaceChecklistPath` 를 함께 유지해야 한다
- next surface / next frame / next surface section / next surface checklist packet 은 `activeBlocker` 를 함께 유지해 상위 packet 진입점에서도 gate blocker를 바로 확인할 수 있어야 한다
- next section action card 는 `activeBlocker`, `recommendedSurface`, `recommendedFrame`, `recommendedSection`, `checklistPreview`, `actionItems` 를 함께 유지해야 한다
- compare entry manual figma packet: `output/playwright/compare-entry-manual-figma-packet.html`
- compare entry manual frame specs: `output/playwright/compare-entry-manual-frame-specs.md`
- compare entry manual build worksheet: `output/playwright/compare-entry-manual-build-worksheet.md`
- compare entry review session archive: `output/playwright/compare-entry-review-sessions/<timestamp>/`
- compare entry review archive index: `output/playwright/compare-entry-review-sessions/index.html`
- compare entry review archive index json: `output/playwright/compare-entry-review-sessions/index.json`
- compare entry latest stable handoff: `output/playwright/compare-entry-review-sessions/latest-handoff.md`
- compare entry latest stable handoff board: `output/playwright/compare-entry-review-sessions/latest-handoff.html`
- compare entry latest stable handoff json: `output/playwright/compare-entry-review-sessions/latest-handoff.json`
- latest handoff 와 archive index 는 `recommendedNextSurface`, `recommendedNextFrame`, `recommendedNextSection` 를 직접 노출해야 한다

수동 Figma review를 마감할 때는 아래 command를 기준 command로 사용한다.

```bash
npm run ntl:compare-entry-review-finalize
npm run ntl:compare-entry-review-frame-progress
npm run ntl:compare-entry-review-section-progress
npm run ntl:compare-entry-review-surface-queue
npm run ntl:compare-entry-review-surface-status
npm run ntl:compare-entry-review-next-surface
npm run ntl:compare-entry-review-next-surface-sections
npm run ntl:compare-entry-review-next-surface-checklist
npm run ntl:compare-entry-review-next-section-action
npm run ntl:compare-entry-review-next-frame
npm run ntl:compare-entry-review-next-section
npm run ntl:compare-entry-review-gate
npm run ntl:compare-entry-review-delta
npm run ntl:compare-entry-review-artifact-audit
npm run ntl:compare-entry-linear-update
npm run ntl:compare-entry-approval-board
npm run ntl:compare-entry-review-ready-check
```
- public detail baseline: `output/playwright/detail.png`
- public favorites baseline: `output/playwright/favorites.png`
- compare entry baseline summary: `output/playwright/netlify-compare-entry-baseline.json`
- release smoke summary: `output/playwright/netlify-release-qa-summary.json`
- favorites click-through summary: `output/playwright/netlify-favorites-probe.json`
- synthetic auth summary: `output/playwright/netlify-auth-release-qa-summary.json`
- real-account summary: `output/playwright/netlify-real-account-qa-summary.json`

## Variability Notes

`남자 후드` 검색 결과 수는 production에서 `displayedCount 10~16` 범위로 흔들린다. 따라서 아래 값은 hard assertion으로 쓰지 않는다.

- exact displayed count
- exact first product title
- exact compare-ready group count

대신 아래를 blocker signal로 쓴다.

- `displayedCount <= 0`
- loading state가 끝나지 않음
- input/query/url mismatch
- compare-ready zone 자체가 사라짐
- shortlist/favorites/detail entry가 끊김
- review artifact audit가 `BROKEN` 상태로 남음

## Ticket Validation Ownership

### `SUN-11` Compare Entry Landing

`SUN-10` ready-check 가 exit code `0` 이 되기 전에는 이 ticket을 implementation 단계로 올리지 않는다.

#### Primary Routes

- `/brand/musinsa`
- `/category/sneakers`

#### Required Commands

```bash
npm run typecheck
npm run ntl:quick-pass:prep
npm run ntl:compare-entry-baseline
npm run ntl:compare-entry-review-prep
```

Playwright MCP quick pass 또는 equivalent manual pass로 아래를 확인한다.

#### Pass Signals

- hero, compare lens, search CTA 중 primary action이 하나로 읽힌다
- brand/category 두 route가 같은 visual language로 정렬된다
- landing search CTA 실행 시 `/?q=...&sort=...` 로 정상 이동한다
- search input에는 landing starter query가 의도대로 주입된다
- `CompareShortlistSection` 이 있으면 placement만 바뀌고 behavior는 그대로다

#### Fails If

- landing search CTA가 query/sort를 잃는다
- compare lens와 hero가 서로 다른 hierarchy로 읽혀 first action이 흐려진다
- brand/category 중 하나만 다른 visual shell이나 copy source를 사용한다

#### Artifact To Refresh

- `output/playwright/brand.png`
- `output/playwright/category.png`
- `output/playwright/compare-entry-brand-hero.png`
- `output/playwright/compare-entry-brand-routes.png`
- `output/playwright/compare-entry-brand-shortlist.png`
- `output/playwright/compare-entry-design-review-packet.md`
- `output/playwright/compare-entry-design-review-worksheet.md`
- `output/playwright/compare-entry-design-review-decision-log.md`
- `output/playwright/compare-entry-design-review-board.html`
- `output/playwright/compare-entry-review-status-board.html`
- `output/playwright/compare-entry-review-status.json`
- `output/playwright/compare-entry-review-closeout-draft.md`
- `output/playwright/compare-entry-review-closeout-draft.json`
- `output/playwright/compare-entry-review-gate.md`
- `output/playwright/compare-entry-review-gate.json`
- `output/playwright/compare-entry-review-delta.md`
- `output/playwright/compare-entry-review-delta.json`
- `output/playwright/compare-entry-review-artifact-audit.md`
- `output/playwright/compare-entry-review-artifact-audit.json`
- `output/playwright/compare-entry-linear-update-draft.md`
- `output/playwright/compare-entry-linear-update-draft.txt`
- `output/playwright/compare-entry-linear-update-draft.json`
- `output/playwright/compare-entry-approval-board.html`
- `output/playwright/compare-entry-approval-board.json`
- `output/playwright/compare-entry-manual-figma-packet.html`
- `output/playwright/compare-entry-manual-frame-specs.md`
- `output/playwright/compare-entry-manual-build-worksheet.md`
- `output/playwright/compare-entry-review-sessions/<timestamp>/manifest.json`
- `output/playwright/compare-entry-review-sessions/index.html`
- `output/playwright/compare-entry-review-sessions/latest-handoff.md`
- `output/playwright/compare-entry-review-sessions/latest-handoff.html`
- `output/playwright/compare-entry-review-sessions/latest-handoff.json`

### `SUN-12` Search Result Compare Hierarchy

`SUN-10` ready-check 가 exit code `0` 이 되기 전에는 이 ticket을 implementation 단계로 올리지 않는다.

#### Primary Routes

- `/?q=남자%20후드&sort=sim`
- `/favorites`
- `ntl:release-qa-smoke` 가 resolve 한 detail route

#### Required Commands

```bash
npm run typecheck
npm run ntl:compare-entry-baseline
npm run ntl:compare-entry-review-prep
npm run ntl:release-qa-smoke
npm run ntl:favorites-probe
```

필요하면 quick pass로 search result first fold를 추가 확인한다.

#### Pass Signals

- compare-ready zone이 generic result grid보다 먼저 읽힌다
- summary metrics, trust, PDP, checkout evidence가 scan 가능하다
- shortlist re-entry가 side feature가 아니라 workflow continuity로 보인다
- detail compare intro / mall compare / price history / decision block 진입이 그대로 유지된다
- favorites compare click-through가 그대로 유지된다

#### Fails If

- compare-ready zone이 사라지거나 generic grid와 구분이 안 된다
- detail modal / compare page entry가 깨진다
- favorites probe summary에서 `comparePageReachable` 또는 `favoritesLinkClickThrough` 가 false가 된다

#### Artifact To Refresh

- `output/playwright/search-results-longwait.png`
- `output/playwright/netlify-compare-entry-baseline.json`
- `output/playwright/compare-entry-search-summary.png`
- `output/playwright/compare-entry-search-highlights.png`
- `output/playwright/compare-entry-search-highlight-card.png`
- `output/playwright/compare-entry-search-result-card.png`
- `output/playwright/netlify-compare-entry-surface-reference.json`
- `output/playwright/compare-entry-design-review-packet.md`
- `output/playwright/compare-entry-design-review-worksheet.md`
- `output/playwright/compare-entry-design-review-decision-log.md`
- `output/playwright/compare-entry-design-review-board.html`
- `output/playwright/compare-entry-review-status-board.html`
- `output/playwright/compare-entry-review-status.json`
- `output/playwright/compare-entry-review-closeout-draft.md`
- `output/playwright/compare-entry-review-closeout-draft.json`
- `output/playwright/compare-entry-review-gate.md`
- `output/playwright/compare-entry-review-gate.json`
- `output/playwright/compare-entry-review-delta.md`
- `output/playwright/compare-entry-review-delta.json`
- `output/playwright/compare-entry-review-artifact-audit.md`
- `output/playwright/compare-entry-review-artifact-audit.json`
- `output/playwright/compare-entry-linear-update-draft.md`
- `output/playwright/compare-entry-linear-update-draft.txt`
- `output/playwright/compare-entry-linear-update-draft.json`
- `output/playwright/compare-entry-approval-board.html`
- `output/playwright/compare-entry-approval-board.json`
- `output/playwright/compare-entry-manual-figma-packet.html`
- `output/playwright/compare-entry-manual-frame-specs.md`
- `output/playwright/compare-entry-manual-build-worksheet.md`
- `output/playwright/compare-entry-review-sessions/<timestamp>/manifest.json`
- `output/playwright/compare-entry-review-sessions/index.html`
- `output/playwright/compare-entry-review-sessions/latest-handoff.md`
- `output/playwright/compare-entry-review-sessions/latest-handoff.html`
- `output/playwright/compare-entry-review-sessions/latest-handoff.json`
- `output/playwright/detail.png`
- `output/playwright/favorites.png`
- `output/playwright/netlify-release-qa-summary.json`
- `output/playwright/netlify-favorites-probe.json`

### `SUN-13` Validation and Release Closure

`SUN-11` / `SUN-12` 가 끝나기 전에는 `SUN-13` 을 실행하지 않는다.

#### Required Commands

```bash
npm run typecheck
npm run ntl:browser-smoke
npm run ntl:compare-entry-baseline
npm run ntl:release-qa-smoke
npm run ntl:favorites-probe
npm run ntl:auth-release-qa
```

그 다음 quick pass와 필요 시 real-account helper를 순서대로 실행한다.

```bash
$HOME/.codex/skills/playwright/scripts/playwright_cli.sh close-all
npm run ntl:quick-pass:prep
npm run ntl:real-account-qa:start
npm run ntl:real-account-qa:verify
```

#### Minimum Acceptance

- `typecheck` 통과
- browser smoke에서 brand/category/home compare entry surface 회귀 없음
- compare-entry baseline runner가 `brand/category/search` screenshot과 summary JSON을 다시 생성함
- release QA smoke에서 detail compare intro / compare section / price history section 유지
- favorites probe에서 write/read/delete/click-through/cleanup 모두 유지
- synthetic auth summary에서 `ok=true`
- real-account verify를 실행했다면 `hasProfileAvatar=true`, `hasResults=true`, detail/favorites key signal 유지

#### Optional Follow-up

- admin smoke는 redesign scope 밖이므로 mandatory set에 넣지 않는다
- physical Android sign-off는 web redesign blocker로 취급하지 않는다

## Summary JSON Keys To Watch

### `output/playwright/netlify-release-qa-summary.json`

- `searchDisplayedCount > 0`
- `detailPage.hasCompareIntro === true`
- `detailPage.hasCompareSection === true`
- `detailPage.hasPriceHistorySection === true`
- `favorites.hasLookbookHeader === true`
- `favorites.hasSavedSummary === true`

### `output/playwright/netlify-compare-entry-baseline.json`

- `screenshots.brand` exists
- `screenshots.category` exists
- `screenshots.search` exists
- `search.displayedCount > 0`

### `output/playwright/netlify-favorites-probe.json`

- `verified.firestoreWrite === true`
- `verified.visibleInFavorites === true`
- `verified.favoritesLinkClickThrough === true`
- `verified.comparePageReachable === true`
- `verified.firestoreCleanup === true`
- `verified.restoredBaselineCount === true`

### `output/playwright/netlify-auth-release-qa-summary.json`

- `ok === true`
- `steps[].ok === true` for all executed steps

### `output/playwright/netlify-real-account-qa-summary.json`

- `authState.hasProfileAvatar === true`
- `authState.hasSignOut === true`
- `search.hasResults === true`
- `search.loading === false`
- `detail.hasCompareIntro === true`
- `detail.hasMallCompare === true`
- `detail.hasPriceHistory === true`
- `detail.hasDecisionBlock === true`
- `favorites.hasLookbook === true`
- `favorites.hasSavedSummary === true`

## Decision Rule

아래 중 하나라도 깨지면 `SUN-13` 에서 regression으로 본다.

- compare entry route에서 search handoff 실패
- compare-ready zone disappearance
- shortlist/favorites continuity break
- detail compare core section disappearance
- auth-bound favorites/detail flow break

정확한 결과 개수 변화만으로는 regression으로 보지 않는다. count drift는 `0 results`, `loading stuck`, `query mismatch` 와 같이 사용자 흐름을 끊는 신호와 함께 있을 때만 blocker로 본다.
