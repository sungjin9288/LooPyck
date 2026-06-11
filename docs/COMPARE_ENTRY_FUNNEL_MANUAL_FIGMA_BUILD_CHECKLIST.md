# Compare Entry Funnel Manual Figma Build Checklist

## Purpose

이 문서는 `Figma MCP Starter plan` 제한으로 자동 frame 생성을 못 하는 상황에서, 사람이 직접 `SUN-10` kickoff frame을 만들 때 따라야 하는 순서를 고정한다.

목표는 세 가지다.

1. frame/page 생성 순서를 흔들리지 않게 한다.
2. manifest / content matrix / component inventory / review artifact를 한 흐름으로 묶는다.
3. 수동 build가 끝난 뒤 `Approved / Needs Revision` 판정까지 같은 session 안에서 이어지게 한다.

## Before You Start

### Direction Lock

현재 Compare Entry funnel 라운드는 `Figma-first` 로 운영한다.

- `SUN-10` 이 `READY` 가 되기 전에는 `SUN-11` / `SUN-12` 구현을 시작하지 않는다.
- 현재 first slice는 `Brand-Musinsa -> CompareEntry/Desktop/Brand-Musinsa -> TopNav/Context` 로 고정한다.
- surface 진행 순서는 `Brand-Musinsa -> Category-Sneakers -> Search-Results-Hood` 로 고정한다.
- 각 surface 안에서는 `Desktop -> Mobile` 순서로 진행한다.
- 새 review/tooling 추가는 중단하고, 기존 packet/checklist만 사용한다.

### Required Inputs

- [`docs/COMPARE_ENTRY_FUNNEL_FIGMA_MANIFEST.md`](/Users/sungjin/dev/personal/LooPyck/docs/COMPARE_ENTRY_FUNNEL_FIGMA_MANIFEST.md)
- [`docs/COMPARE_ENTRY_FUNNEL_CONTENT_MATRIX.md`](/Users/sungjin/dev/personal/LooPyck/docs/COMPARE_ENTRY_FUNNEL_CONTENT_MATRIX.md)
- [`docs/COMPARE_ENTRY_FUNNEL_COMPONENT_INVENTORY.md`](/Users/sungjin/dev/personal/LooPyck/docs/COMPARE_ENTRY_FUNNEL_COMPONENT_INVENTORY.md)
- [`docs/COMPARE_ENTRY_FUNNEL_DESIGN_REVIEW_CHECKLIST.md`](/Users/sungjin/dev/personal/LooPyck/docs/COMPARE_ENTRY_FUNNEL_DESIGN_REVIEW_CHECKLIST.md)

### Refresh Production Reference Artifacts

수동 build 시작 전 아래 command를 먼저 실행한다.

```bash
npm run ntl:compare-entry-review-prep
```

reviewer / builder entrypoint는 아래 둘 중 하나로 고정한다.

- [`latest-handoff.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-sessions/latest-handoff.html)
- [`latest-handoff.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-sessions/latest-handoff.json)
- [`compare-entry-review-evidence-summary.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-evidence-summary.md)
- [`compare-entry-review-evidence-summary.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-evidence-summary.json)
- [`compare-entry-review-next-section-action-card.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-section-action-card.html)

이 command가 아래 artifact를 최신 상태로 만든다.

- [`netlify-compare-entry-surface-reference.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/netlify-compare-entry-surface-reference.json)
- [`compare-entry-design-review-packet.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-design-review-packet.md)
- [`compare-entry-design-review-worksheet.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-design-review-worksheet.md)
- [`compare-entry-design-review-decision-log.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-design-review-decision-log.md)
- [`compare-entry-design-review-board.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-design-review-board.html)
- [`compare-entry-manual-figma-packet.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-manual-figma-packet.html)
- [`compare-entry-manual-frame-specs.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-manual-frame-specs.md)
- [`compare-entry-manual-build-worksheet.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-manual-build-worksheet.md)
- [`compare-entry-review-status-board.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-status-board.html)
- [`compare-entry-review-status.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-status.json)
- [`compare-entry-review-missing-detail.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-missing-detail.md)
- [`compare-entry-review-missing-detail.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-missing-detail.json)
- [`compare-entry-review-focus-plan.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-focus-plan.md)
- [`compare-entry-review-focus-plan.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-focus-plan.json)
- [`compare-entry-review-frame-progress-board.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-frame-progress-board.html)
- [`compare-entry-review-frame-progress-board.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-frame-progress-board.json)
- [`compare-entry-review-section-progress-board.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-section-progress-board.html)
- [`compare-entry-review-section-progress-board.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-section-progress-board.md)
- [`compare-entry-review-section-progress-board.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-section-progress-board.json)
- [`compare-entry-review-surface-queue.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-surface-queue.html)
- [`compare-entry-review-surface-queue.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-surface-queue.md)
- [`compare-entry-review-surface-queue.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-surface-queue.json)
- [`compare-entry-review-surface-status-board.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-surface-status-board.html)
- [`compare-entry-review-surface-status-board.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-surface-status-board.md)
- [`compare-entry-review-surface-status-board.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-surface-status-board.json)
- [`compare-entry-review-next-surface-packet.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-packet.html)
- [`compare-entry-review-next-surface-packet.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-packet.md)
- [`compare-entry-review-next-surface-packet.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-packet.json)
- [`compare-entry-review-next-surface-section-packet.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-section-packet.html)
- [`compare-entry-review-next-surface-section-packet.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-section-packet.md)
- [`compare-entry-review-next-surface-section-packet.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-section-packet.json)
- [`compare-entry-review-next-surface-checklist.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-checklist.html)
- [`compare-entry-review-next-surface-checklist.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-checklist.md)
- [`compare-entry-review-next-surface-checklist.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-checklist.json)
- [`compare-entry-review-next-section-action-card.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-section-action-card.html)
- [`compare-entry-review-next-section-action-card.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-section-action-card.md)
- [`compare-entry-review-next-section-action-card.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-section-action-card.json)
- [`compare-entry-review-next-frame-packet.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-frame-packet.html)
- [`compare-entry-review-next-frame-packet.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-frame-packet.md)
- [`compare-entry-review-next-frame-packet.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-frame-packet.json)
- [`compare-entry-review-next-section-packet.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-section-packet.html)
- [`compare-entry-review-next-section-packet.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-section-packet.md)
- [`compare-entry-review-next-section-packet.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-section-packet.json)
- [`compare-entry-review-closeout-draft.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-closeout-draft.md)
- [`compare-entry-review-closeout-draft.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-closeout-draft.json)
- [`compare-entry-review-gate.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-gate.md)
- [`compare-entry-review-gate.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-gate.json)
- [`compare-entry-review-delta.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-delta.md)
- [`compare-entry-review-delta.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-delta.json)
- [`compare-entry-review-artifact-audit.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-artifact-audit.md)
- [`compare-entry-review-artifact-audit.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-artifact-audit.json)
- [`compare-entry-linear-update-draft.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-linear-update-draft.md)
- [`compare-entry-linear-update-draft.txt`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-linear-update-draft.txt)
- [`compare-entry-linear-update-draft.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-linear-update-draft.json)
- [`compare-entry-approval-board.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-approval-board.html)
- [`compare-entry-approval-board.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-approval-board.json)
- latest archived session index: [`index.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-sessions/index.html)
- latest stable handoff note: [`latest-handoff.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-sessions/latest-handoff.md)
- latest stable handoff board: [`latest-handoff.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-sessions/latest-handoff.html)
- latest stable handoff json: [`latest-handoff.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-sessions/latest-handoff.json)

standalone으로 manual build packet만 다시 만들고 싶으면 아래 command도 실행한다.

```bash
npm run ntl:compare-entry-manual-figma-packet
```

결과:

- [`compare-entry-manual-figma-packet.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-manual-figma-packet.html)

frame별 제작 시트만 다시 만들고 싶으면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-manual-frame-specs
```

결과:

- [`compare-entry-manual-frame-specs.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-manual-frame-specs.md)

제작 중 체크박스 시트만 다시 만들고 싶으면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-manual-build-worksheet
```

결과:

- [`compare-entry-manual-build-worksheet.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-manual-build-worksheet.md)

현재 작성 상태를 status board로 확인하려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-review-status
```

결과:

- [`compare-entry-review-status-board.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-status-board.html)
- [`compare-entry-review-status.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-status.json)

이 status board는 이제 `recommendedNextSurface`, `recommendedNextFrame`, `recommendedNextSection`, `recommendedNextSurfaceChecklistPath` 도 함께 보여줘야 하며, reviewer가 첫 진입점으로 바로 쓸 수 있어야 한다.
추가로 `recommendedNextSectionActionCardPath`, `recommendedNextSectionActionFirstItem` 도 같이 보여줘서 지금 당장 열어야 할 action card와 첫 실행 문장을 status 단계에서 바로 확인할 수 있어야 한다.

현재 차단 원인을 action plan으로 압축해서 보려면 아래 artifact를 먼저 확인한다.

- [`compare-entry-review-focus-plan.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-focus-plan.md)
- [`compare-entry-review-focus-plan.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-focus-plan.json)

`activeBlocker` 가 `none` 이 아니면 focus plan의 첫 `topActions` 항목은 `kind: active-blocker`, `priority: 0` 이어야 한다. Figma MCP quota 차단 상태에서는 `figma-mcp-rate-limit` 가 P0 action으로 표시되고, worksheet는 실제 Figma node가 생성되기 전까지 체크하지 않는다.

frame backlog 위에 semantic section order를 같이 보려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-review-section-progress
```

결과:

- [`compare-entry-review-section-progress-board.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-section-progress-board.html)
- [`compare-entry-review-section-progress-board.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-section-progress-board.md)
- [`compare-entry-review-section-progress-board.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-section-progress-board.json)

추천 surface 내부의 frame+section 실행 순서를 한 번에 보려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-review-next-surface-sections
```

결과:

- [`compare-entry-review-next-surface-section-packet.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-section-packet.html)
- [`compare-entry-review-next-surface-section-packet.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-section-packet.md)
- [`compare-entry-review-next-surface-section-packet.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-section-packet.json)

추천 surface를 실제 체크박스 순서로 따라가려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-review-next-surface-checklist
```

결과:

- [`compare-entry-review-next-surface-checklist.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-checklist.html)
- [`compare-entry-review-next-surface-checklist.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-checklist.md)
- [`compare-entry-review-next-surface-checklist.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-checklist.json)

지금 바로 시작할 section action card가 필요하면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-review-next-section-action
```

결과:

- [`compare-entry-review-next-section-action-card.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-section-action-card.html)
- [`compare-entry-review-next-section-action-card.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-section-action-card.md)
- [`compare-entry-review-next-section-action-card.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-section-action-card.json)

Figma MCP limit으로 현재 next slice를 직접 쓸 수 없으면, worksheet를 체크하지 말고 fallback preview만 생성한다.

```bash
npm run ntl:compare-entry-figma-mcp-attempt
npm run ntl:compare-entry-mobile-brand-topnav-preview
npm run ntl:compare-entry-figma-retry-packet
```

결과:

- [`compare-entry-figma-mcp-attempt.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-figma-mcp-attempt.md)
- [`compare-entry-figma-mcp-attempt.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-figma-mcp-attempt.json)
- [`compare-entry-figma-mcp-attempt-history.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-figma-mcp-attempt-history.md)
- [`compare-entry-figma-mcp-attempt-history.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-figma-mcp-attempt-history.json)
- [`compare-entry-mobile-brand-topnav-preview.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-mobile-brand-topnav-preview.html)
- [`compare-entry-mobile-brand-topnav-preview.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-mobile-brand-topnav-preview.json)
- [`compare-entry-figma-retry-packet.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-figma-retry-packet.md)
- [`compare-entry-figma-retry-packet.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-figma-retry-packet.json)

이 preview는 `Brand-Musinsa -> CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context` 의 재시도용 visual reference다. MCP attempt report는 마지막 `use_figma` 재시도 결과와 rate-limit/paywall evidence를 남기고, attempt history는 일반 Figma MCP와 app MCP 같은 대체 경로 재시도 이력을 최근 20건까지 누적한다. retry packet은 action card, preview JSON, Figma template module, 최신 MCP attempt, attempt history를 cross-check해서 `ready-for-figma-mcp-retry` 상태를 남긴다. 실제 Figma node가 생성되기 전에는 `compare-entry-manual-build-worksheet.md` 를 체크하지 않는다.
next-section action card도 gate의 `activeBlocker` 를 직접 노출해야 한다. `figma-mcp-rate-limit` 상태에서는 action card의 `Active Blocker` 패널에서 retry packet evidence path와 latest MCP status를 확인한 뒤, 실제 Figma node가 생성되기 전까지 worksheet를 체크하지 않는다.

`npm run ntl:compare-entry-review-finalize` 는 retry packet과 MCP attempt artifact를 closeout / Linear update draft / approval board / latest handoff / archive index까지 전파한다. 따라서 reviewer는 아래 artifact 중 아무 곳에서나 `Figma Retry Packet` 상태와 `retryReady` 값을 확인할 수 있다.

- `compare-entry-review-closeout-draft.md`
- `compare-entry-linear-update-draft.md`
- `compare-entry-approval-board.html`

Figma MCP quota 차단이 반복되면 같은 retry를 계속 반복하지 말고 unblock plan을 먼저 생성한다.

```bash
npm run ntl:compare-entry-manual-ui-slice-packet
npm run ntl:compare-entry-figma-capture-reference
npm run ntl:compare-entry-manual-node-evidence
npm run ntl:compare-entry-figma-unblock-plan
```

결과:

- [`compare-entry-manual-ui-slice-packet.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-manual-ui-slice-packet.md)
- [`compare-entry-manual-ui-slice-packet.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-manual-ui-slice-packet.json)
- [`compare-entry-figma-capture-reference.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-figma-capture-reference.md)
- [`compare-entry-figma-capture-reference.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-figma-capture-reference.json)
- [`compare-entry-manual-node-evidence.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-manual-node-evidence.md)
- [`compare-entry-manual-node-evidence.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-manual-node-evidence.json)
- [`compare-entry-manual-node-apply-command.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-manual-node-apply-command.md)
- [`compare-entry-manual-node-apply-command.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-manual-node-apply-command.json)
- [`compare-entry-manual-unblock-cockpit.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-manual-unblock-cockpit.html)
- [`compare-entry-manual-unblock-cockpit.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-manual-unblock-cockpit.md)
- [`compare-entry-manual-unblock-cockpit.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-manual-unblock-cockpit.json)
- [`compare-entry-figma-unblock-plan.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-figma-unblock-plan.md)
- [`compare-entry-figma-unblock-plan.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-figma-unblock-plan.json)

unblock plan의 기본 권장 경로는 둘 중 하나다.

- Figma plan을 업그레이드하거나 MCP quota reset을 기다린 뒤 retry packet template을 재실행한다.
- Figma UI에서 fallback preview를 보고 `CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context` 를 직접 만든 뒤, 실제 `frameId` / `sectionId` 가 확인된 slice만 worksheet에 체크한다.

`generate_figma_design` 로 기존 Figma file에 fallback preview를 캡처한 경우에도 raw capture node는 visual reference로만 취급한다. 캡처 root, mobile frame, top nav section 이름이 target contract와 다르면 `compare-entry-manual-build-worksheet.md` 를 체크하지 않는다.
Figma UI에서 이름을 직접 고쳤거나 수동 rebuild를 완료했다면 아래처럼 실제 node id와 확인 결과를 먼저 evidence로 남긴다.

```bash
COMPARE_ENTRY_MANUAL_NODE_FRAME_ID='10:17' \
COMPARE_ENTRY_MANUAL_NODE_SECTION_ID='10:18' \
COMPARE_ENTRY_MANUAL_NODE_FRAME_NAME_MATCHES=true \
COMPARE_ENTRY_MANUAL_NODE_SECTION_NAME_MATCHES=true \
COMPARE_ENTRY_MANUAL_NODE_VISUALLY_MATCHES_PREVIEW=true \
npm run ntl:compare-entry-manual-node-evidence
```

Figma UI에서 `Copy link` 로 얻은 URL만 있는 경우에는 raw id 대신 URL을 그대로 넣을 수 있다. frame/section 이름이 각각 `CompareEntry/Mobile/Brand-Musinsa`, `TopNav/Context` 와 정확히 일치하고 visual preview와도 일치함을 직접 확인한 경우에만 short-form verification flag를 사용한다.
copied URL의 fileKey는 반드시 `Oj35jzmgbwnxzpTTqTcxLi` 여야 한다. 다른 Figma file URL이면 `CONTRACT_VERIFIED` 를 넘겨도 `readyForWorksheetCheck=false` 로 유지된다.

```bash
COMPARE_ENTRY_MANUAL_NODE_FRAME_URL='https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi?node-id=10-17' \
COMPARE_ENTRY_MANUAL_NODE_SECTION_URL='https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi?node-id=10-18' \
COMPARE_ENTRY_MANUAL_NODE_CONTRACT_VERIFIED=true \
npm run ntl:compare-entry-manual-node-evidence
```

`compare-entry-manual-node-evidence.json` 의 `readyForWorksheetCheck` 가 `true` 일 때만 아래 command로 `CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context` worksheet item을 체크한다.

```bash
npm run ntl:compare-entry-apply-manual-node-evidence
```

이 command는 `readyForWorksheetCheck`, `frameId`, `sectionId`, frame name match, section name match, visual match가 모두 통과하지 않으면 non-zero로 종료하고 worksheet를 변경하지 않는다.
evidence 생성, guarded worksheet apply, finalize, ready-check를 한 번에 이어가려면 같은 env 값으로 아래 command를 사용한다.

```bash
COMPARE_ENTRY_MANUAL_NODE_FRAME_ID='10:17' \
COMPARE_ENTRY_MANUAL_NODE_SECTION_ID='10:18' \
COMPARE_ENTRY_MANUAL_NODE_FRAME_NAME_MATCHES=true \
COMPARE_ENTRY_MANUAL_NODE_SECTION_NAME_MATCHES=true \
COMPARE_ENTRY_MANUAL_NODE_VISUALLY_MATCHES_PREVIEW=true \
npm run ntl:compare-entry-manual-node-apply
```

URL 기반으로 한 번에 이어가려면 같은 방식으로 `FRAME_URL`, `SECTION_URL`, `CONTRACT_VERIFIED=true` 를 `ntl:compare-entry-manual-node-apply` 에 넘긴다.
또는 아래처럼 copied Figma URL 두 개와 explicit confirmation token을 positional argument로 넘길 수 있다.

```bash
npm run ntl:compare-entry-manual-node-apply-command
npm run ntl:compare-entry-manual-unblock-cockpit
```

첫 번째 command는 현재 recommended slice 기준의 copy-ready command template을 `compare-entry-manual-node-apply-command.md` 에 재생성한다.
두 번째 command는 preview, required checks, apply command, evidence state, gate links를 한 화면에 묶은 `compare-entry-manual-unblock-cockpit.html` 을 재생성한다.

```bash
npm run ntl:compare-entry-manual-node-apply -- \
  'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=10-17' \
  'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=10-18' \
  CONTRACT_VERIFIED
```

`CONTRACT_VERIFIED` 는 frame name, section name, visual match를 Figma UI에서 직접 확인했다는 의미이므로 자동 추론값으로 사용하지 않는다.

`code-first-policy-override` 는 `Design+Code` 완료 기준을 깨는 예외 경로이므로 사용자 명시 승인 없이는 선택하지 않는다.

실제 작업 순서는 아래 11개 artifact를 고정 순서로 연다.

1. `compare-entry-review-next-section-action-card.html`
2. `compare-entry-review-next-surface-checklist.html`
3. `compare-entry-figma-unblock-plan.md`
4. `compare-entry-figma-capture-reference.md`
5. `compare-entry-manual-node-evidence.md`
6. `compare-entry-manual-node-apply-command.md`
7. `compare-entry-manual-unblock-cockpit.html`
8. `compare-entry-manual-ui-slice-packet.md`
7. `compare-entry-figma-retry-packet.md`
8. `compare-entry-manual-frame-specs.md`
9. `compare-entry-manual-build-worksheet.md`
10. `compare-entry-design-review-worksheet.md`
11. `compare-entry-design-review-decision-log.md`

approval closeout 초안까지 같이 만들려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-review-closeout
```

결과:

- [`compare-entry-review-closeout-draft.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-closeout-draft.md)
- [`compare-entry-review-closeout-draft.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-closeout-draft.json)

이 draft에는 `recommendedNextSurfaceFrameCount`, `recommendedNextSurfaceSectionCount`, `recommendedNextSurfaceSectionPreview`, `recommendedNextSurfaceChecklistPath`, `recommendedNextSurfaceChecklistFirstFrame`, `recommendedNextSurfaceChecklistFirstSection` 가 같이 들어가므로, surface 내부 backlog가 어디까지 남았는지와 지금 당장 체크를 시작할 frame/section이 무엇인지 closeout 단계에서도 바로 확인할 수 있어야 한다.
같은 draft에는 `recommendedNextSectionActionCardPath`, `recommendedNextSectionActionFirstItem` 도 같이 들어가서 closeout/Linear update/approval board 에서 바로 첫 action 문장을 재사용할 수 있어야 한다.

strict unblock gate를 확인하려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-review-gate
```

strict exit code까지 포함해서 검사하려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-review-gate:strict
```

결과:

- [`compare-entry-review-gate.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-gate.md)
- [`compare-entry-review-gate.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-gate.json)

직전 archived session과의 차이를 보려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-review-delta
```

결과:

- [`compare-entry-review-delta.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-delta.md)
- [`compare-entry-review-delta.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-delta.json)

artifact bundle 자체가 온전한지 검사하려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-review-artifact-audit
```

결과:

- [`compare-entry-review-artifact-audit.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-artifact-audit.md)
- [`compare-entry-review-artifact-audit.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-artifact-audit.json)

Linear 이슈에 붙일 문안 초안을 만들려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-linear-update
```

결과:

- [`compare-entry-linear-update-draft.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-linear-update-draft.md)
- [`compare-entry-linear-update-draft.txt`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-linear-update-draft.txt)
- [`compare-entry-linear-update-draft.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-linear-update-draft.json)

이 draft에도 같은 `recommended surface` frame/section summary와 preview가 유지되어야 한다.

승인/차단 판단을 한 화면에서 보려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-approval-board
```

결과:

- [`compare-entry-approval-board.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-approval-board.html)
- [`compare-entry-approval-board.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-approval-board.json)

approval board에서도 `recommended surface frames / sections` metric 과 preview list를 같이 노출해야 한다.

이 board는 `gate / artifact audit / top blocked surfaces / top blocked sections / top blocked frames / closeout / Linear draft`를 한 화면에서 같이 보여준다.
closeout draft / Linear update draft / approval board 도 같은 surface status 요약(`blockedSurfaceCount`, `readySurfaceCount`, `recommendedNextSurface`)과 `top blocked sections` 를 같이 노출해야 한다.

surface별 `READY / BLOCKED` 판정만 따로 보려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-review-surface-status
```

결과:

- [`compare-entry-review-surface-status-board.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-surface-status-board.html)
- [`compare-entry-review-surface-status-board.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-surface-status-board.md)
- [`compare-entry-review-surface-status-board.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-surface-status-board.json)

surface status board도 `activeBlocker`, `recommendedNextFrame`, `recommendedNextSection`, `recommendedNextSurfaceChecklistPath` 를 같이 노출해서 surface triage와 첫 section 착수를 한 화면에서 연결해야 한다.
`Active Blocker` 패널의 `target`, `latestStatus`, `latestOperation`, `evidencePath`, `nextAction` 이 gate와 다르면 stale artifact로 보고 `npm run ntl:compare-entry-review-finalize` 를 먼저 재실행한다.
next surface packet, next frame packet, next surface section packet, next surface checklist도 같은 `activeBlocker` 를 이어받아야 하므로 어느 packet에서 시작해도 `figma-mcp-rate-limit` 와 worksheet 미체크 조건을 확인할 수 있어야 한다.

추천된 다음 surface 하나만 열어 수동 build 순서를 따라가려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-review-next-surface
```

결과:

- [`compare-entry-review-next-surface-packet.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-packet.html)
- [`compare-entry-review-next-surface-packet.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-packet.md)
- [`compare-entry-review-next-surface-packet.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-surface-packet.json)

추천된 surface 안에서 가장 먼저 손대야 하는 frame 하나만 열어 수동 build 순서를 따라가려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-review-next-frame
```

결과:

- [`compare-entry-review-next-frame-packet.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-frame-packet.html)
- [`compare-entry-review-next-frame-packet.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-frame-packet.md)
- [`compare-entry-review-next-frame-packet.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-frame-packet.json)

추천된 frame 안에서 가장 먼저 손대야 하는 section 하나만 열어 수동 build 순서를 따라가려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-review-next-section
```

결과:

- [`compare-entry-review-next-section-packet.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-section-packet.html)
- [`compare-entry-review-next-section-packet.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-section-packet.md)
- [`compare-entry-review-next-section-packet.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-next-section-packet.json)

worksheet와 decision log를 채운 뒤 현재 review session을 finalize 하려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-review-finalize
```

이 command는 아래를 한 번에 갱신한다.

- [`compare-entry-review-status-board.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-status-board.html)
- [`compare-entry-review-status.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-status.json)
- [`compare-entry-review-closeout-draft.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-closeout-draft.md)
- [`compare-entry-review-closeout-draft.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-closeout-draft.json)
- [`compare-entry-review-gate.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-gate.md)
- [`compare-entry-review-gate.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-gate.json)
- [`compare-entry-review-delta.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-delta.md)
- [`compare-entry-review-delta.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-delta.json)
- [`compare-entry-review-artifact-audit.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-artifact-audit.md)
- [`compare-entry-review-artifact-audit.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-artifact-audit.json)
- [`compare-entry-linear-update-draft.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-linear-update-draft.md)
- [`compare-entry-linear-update-draft.txt`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-linear-update-draft.txt)
- [`compare-entry-linear-update-draft.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-linear-update-draft.json)
- [`compare-entry-approval-board.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-approval-board.html)
- [`compare-entry-approval-board.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-approval-board.json)
- [`index.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-sessions/index.html)
- [`index.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-sessions/index.json)
- [`latest-handoff.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-sessions/latest-handoff.md)
- [`latest-handoff.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-sessions/latest-handoff.html)
- [`latest-handoff.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-sessions/latest-handoff.json)

최종 승인 가능 여부까지 한 번에 확인하려면 아래 command를 실행한다.

```bash
npm run ntl:compare-entry-review-ready-check
```

이 command는 `finalize` 후 strict gate까지 연속 실행한다.
`SUN-10` 이 아직 unblock 상태가 아니거나 artifact audit가 `BROKEN` 이면 non-zero exit code로 끝난다.
blocked output에는 `activeBlocker`, target, latest MCP status, evidence path, nextAction 이 포함되어야 한다.
blocked/passed output에는 artifact audit의 `artifactAuditState`, `activeBlockerMismatchCount`, `activeBlockerFilesChecked` 도 포함되어 command log만으로 bundle integrity와 blocker consistency를 함께 확인할 수 있어야 한다.
`compare-entry-review-gate.{md,json}` 와 `compare-entry-approval-board.{html,json}` 도 같은 artifact audit summary를 보존해야 하며, reviewer는 gate/approval board만 열어도 stale blocker artifact 여부를 확인할 수 있어야 한다.
approval board는 `latest-handoff.json` 과 archive `index.json` link도 함께 노출해서 automation handoff context와 archived session index를 board에서 바로 열 수 있어야 한다.
`latest-handoff.{md,html,json}` 와 review session `index.html` 도 같은 audit state, blocker mismatch count, checked file count를 상위 navigation view에 표시해야 한다.
review session `index.html` 상단 quick link는 `latest-handoff.html`, `latest-handoff.md`, `latest-handoff.json`, `index.json` 을 고정 경로로 노출해 reviewer와 automation이 timestamp session을 찾지 않고 최신 handoff와 archive automation index를 열 수 있게 유지한다.
latest handoff는 archive `index.json` link를 함께 노출하고, review session `index.json` 은 같은 session list, latest handoff link, recommended entry, active blocker, artifact audit summary를 machine-readable 형태로 보존해야 한다.
`compare-entry-review-evidence-summary.{md,json}` 는 gate, artifact audit, approval board, latest handoff, archive index JSON을 single evidence view로 묶어 운영자가 gate 상태와 검증 command checklist를 한 곳에서 확인할 수 있게 유지한다.
artifact audit는 root artifact, `index.json`, `latest-handoff.json`, latest archived session의 `activeBlocker` identity가 gate와 다르면 `BROKEN` 으로 유지한다. audit summary의 `activeBlockerMismatchCount` 가 `0` 이 아니면 `npm run ntl:compare-entry-review-finalize` 로 gate-derived artifact를 다시 맞춘 뒤 ready-check를 재실행한다.
`finalize` 는 내부에서 1차 archive/index/latest-handoff 갱신 후 artifact audit를 다시 만들고, audit-aware gate/approval을 재생성한 뒤 2차 archive/index/latest-handoff 를 다시 덮어쓴다.

## Manual Build Order

아래 순서를 바꾸지 않는다.

1. Figma kickoff file 열기
2. `Compare Entry` page 확인 또는 생성
3. desktop 3 frame 생성
4. mobile 3 frame 생성
5. entry skeleton 3종 (`Hero`, `CompareLens`, `SearchEntry`) 배치
6. `QuickRoutes`, `ShortlistReentry`, `CompareProof`, `SiblingNavigation` 배치
7. search-result frame의 `SearchSummaryMetrics`, `CompareHighlights`, `ResultGrid`, `ShortlistEntry`, `DetailEntryHint` 배치
8. primitive shell (`HighlightCard`, `ResultCard`, `SummaryMetricCard`, `ShortlistButton`)를 identifiable 하게 분리
9. review board/worksheet로 self-review
10. `Approved` 또는 `Needs Revision` 판정 기록

## Page Setup

Starter plan fallback 구조만 사용한다.

- `Compare Entry`
- `Product Detail Compare`
- `Design System Notes`

이번 수동 build 범위는 `Compare Entry` page만 해당한다.

## Frame Checklist

### Desktop Frames

- [ ] `CompareEntry/Desktop/Brand-Musinsa`
- [ ] `CompareEntry/Desktop/Category-Sneakers`
- [ ] `CompareEntry/Desktop/Search-Results-Hood`

규칙:

- width `1440`
- height `hug content`
- page 안에서 brand -> category -> search 순서 유지

### Mobile Frames

- [ ] `CompareEntry/Mobile/Brand-Musinsa`
- [ ] `CompareEntry/Mobile/Category-Sneakers`
- [ ] `CompareEntry/Mobile/Search-Results-Hood`

규칙:

- width `393`
- height `hug content`
- desktop 3 frame 아래 또는 오른쪽에 같은 route 순서로 배치

## Section Assembly Rules

### Entry Frames

아래 순서를 그대로 사용한다.

1. `TopNav/Context`
2. `Hero`
3. `CompareLens`
4. `SearchEntry`
5. `QuickRoutes`
6. `ShortlistReentry`
7. `CompareProof`
8. `SiblingNavigation`

### Search Result Frame

아래 순서를 그대로 사용한다.

1. `SearchSummaryMetrics`
2. `CompareHighlights`
3. `ResultGrid`
4. `ShortlistEntry`
5. `DetailEntryHint`

## Copy / Content Rules

### Brand Frame

- eyebrow, title, description은 content matrix의 `Brand Compare Entry` block을 그대로 사용
- `무신사스탠다드`, `무신사 한정판`, `무신사 세일` 3개 starter tag를 먼저 넣는다
- compare lens 3개 signal 의미를 축약하지 말고 유지한다

### Category Frame

- `👟 스니커즈 비교 시작` headline을 유지한다
- starter keyword 5개를 모두 넣되, mobile에서는 일부를 stack/chip strip으로 처리 가능
- compare lens는 category-specific price spread / option / delivery 의미를 유지한다

### Search Result Frame

- summary metric label 3개는 고정:
  - `최저 결제가`
  - `비교 가능 상품`
  - `최대 결제가 차이`
- highlight zone은 `Compare Ready` 의미가 바로 보이게 한다
- result card는 mall count / trust / PDP / checkout evidence / shortlist action 신호를 잃지 않는다

### Placeholder Rules

동적 값은 placeholder token으로 둔다.

- `{lowestCheckoutPrice}`
- `{compareReadyCount}`
- `{priceSpread}`
- `{mallCount}`
- `{shortlistCount}`
- `{verifiedCount}`

## Primitive Separation Rules

수동 build에서도 아래 primitive는 frame 안에 visually identifiable 해야 한다.

- `CompareEntry/Hero`
- `CompareEntry/CompareLens`
- `CompareEntry/SearchEntry`
- `CompareEntry/QuickRouteCard`
- `CompareEntry/SectionHeader`
- `CompareEntry/SummaryMetricCard`
- `CompareEntry/HighlightCard`
- `CompareEntry/ResultCard`
- `CompareEntry/ShortlistReentry`
- `CompareEntry/ShortlistButton`

판정 기준은 [`docs/COMPARE_ENTRY_FUNNEL_COMPONENT_INVENTORY.md`](/Users/sungjin/dev/personal/LooPyck/docs/COMPARE_ENTRY_FUNNEL_COMPONENT_INVENTORY.md) 를 따른다.

## Manual Review Flow

수동 frame 생성이 끝나면 아래 순서로 self-review 한다.

1. [`compare-entry-design-review-board.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-design-review-board.html) 로 production section shell 확인
2. [`latest-handoff.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-sessions/latest-handoff.html), [`latest-handoff.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-sessions/latest-handoff.md), [`latest-handoff.json`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-sessions/latest-handoff.json) 로 현재 latest session artifact 경로 확인
3. [`compare-entry-manual-build-worksheet.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-manual-build-worksheet.md) 에 frame/section build completion 기록
4. Figma frame과 production shell correspondence 확인
5. [`compare-entry-design-review-worksheet.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-design-review-worksheet.md) 에 frame별 pass/fail 기록
6. [`compare-entry-design-review-decision-log.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-design-review-decision-log.md) 에 outcome / unblock 여부 / revision 메모 기록
7. `npm run ntl:compare-entry-review-finalize` 로 status / closeout / archive / latest handoff 갱신
8. `npm run ntl:compare-entry-review-ready-check` 로 finalize + strict gate를 한 번에 실행
9. [`compare-entry-approval-board.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-approval-board.html) 에서 gate, closeout, Linear draft를 한 화면에서 확인
10. [`compare-entry-linear-update-draft.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-linear-update-draft.md) 로 `SUN-10`, `SUN-11`, `SUN-12` update 초안을 확인
11. [`compare-entry-review-closeout-draft.md`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-closeout-draft.md) 로 `SUN-10` closeout / unblock 초안을 확인
12. [`docs/COMPARE_ENTRY_FUNNEL_DESIGN_REVIEW_CHECKLIST.md`](/Users/sungjin/dev/personal/LooPyck/docs/COMPARE_ENTRY_FUNNEL_DESIGN_REVIEW_CHECKLIST.md) 기준으로 `Approved / Approved With Follow-up / Needs Revision` 판정
13. 필요 시 current session snapshot을 [`compare-entry-review-sessions/index.html`](/Users/sungjin/dev/personal/LooPyck/output/playwright/compare-entry-review-sessions/index.html) 에서 다시 확인

## Done Criteria

아래를 모두 만족해야 manual Figma kickoff가 완료된 것으로 본다.

- [ ] desktop 3 frame, mobile 3 frame 생성 완료
- [ ] frame naming이 manifest와 일치
- [ ] section order가 유지됨
- [ ] content matrix 의미가 유지됨
- [ ] `HighlightCard` / `ResultCard` / `SummaryMetricCard` / `ShortlistButton` 경계가 보임
- [ ] worksheet에 outcome 기록 완료
- [ ] decision log에 approval / revision 메모 기록 완료
- [ ] review outcome이 `Approved` 또는 `Approved With Follow-up`
