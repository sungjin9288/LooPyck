# Compare Entry Review Gate — Operator Manual


Compare Entry redesign work is gated before implementation. Use the ready-check command to
refresh the review bundle and run the strict gate:

```bash
npm run ntl:compare-entry-review-ready-check
```

Current status:

- Completion standard is `Design+Code`, not code-only.
- `SUN-10` is `READY`: build `84/84`, review `35/35`, decision `Approved With Follow-up`, artifact audit `READY`, active blocker `none`.
- The Figma quota blocker was resolved by manual Figma evidence and guarded worksheet application. The protected manual node evidence is `CompareEntry/Mobile/Brand-Musinsa` frame `14:2` and `TopNav/Context` section `14:3`.
- `SUN-11`, `SUN-12`, and `SUN-13` are complete. Future comparable redesign work should follow the same order: design gate first, implementation second, release evidence last.
- Public API, route contracts, search ranking, compare data semantics, Firebase, and AI/search logic remain outside the Compare Entry gate unless explicitly split into follow-up scope.

Historical manual unblock path:

Manual unblock checklist:

1. In Figma, ensure the page is named `SUN-10 Compare Entry`.
2. Ensure the target frame is named exactly `CompareEntry/Mobile/Brand-Musinsa`.
3. Ensure the child section/layer for the top navigation context is named exactly `TopNav/Context`.
4. Copy the real Figma node link for `CompareEntry/Mobile/Brand-Musinsa`.
5. Copy the real Figma node link for `TopNav/Context`.
6. Run the guarded apply command with those two copied URLs and `CONTRACT_VERIFIED`.

Do not pass placeholder values such as `FRAME_FIGMA_URL`, `SECTION_FIGMA_URL`, or
`FRAME_URL_FROM_FIGMA`. The runner rejects placeholders before generating evidence. The
URLs must include `node-id=` and must belong to file `Oj35jzmgbwnxzpTTqTcxLi`.

Key operator artifacts:

- `output/playwright/compare-entry-review-gate.md`
- `output/playwright/compare-entry-review-focus-plan.md`
- `output/playwright/compare-entry-review-surface-status-board.html`
- `output/playwright/compare-entry-figma-retry-packet.md`
- `output/playwright/compare-entry-figma-unblock-plan.md`
- `output/playwright/compare-entry-figma-capture-reference.md`
- `output/playwright/compare-entry-manual-node-evidence.md`
- `output/playwright/compare-entry-manual-node-apply-command.md`
- `output/playwright/compare-entry-manual-node-apply-command-readiness.md`
- `output/playwright/compare-entry-manual-unblock-cockpit.html`
- `output/playwright/compare-entry-manual-ui-slice-packet.md`
- `output/playwright/compare-entry-review-evidence-summary.md`
- `output/playwright/compare-entry-review-evidence-summary.json`
- `output/playwright/compare-entry-review-sessions/index.json`
- `output/playwright/compare-entry-review-sessions/latest-handoff.html`
- `output/playwright/compare-entry-review-sessions/latest-handoff.json`

If the gate is blocked by `figma-mcp-rate-limit`, keep the manual worksheet unchecked until
a real Figma node is created. The current blocker should appear as `activeBlocker` in the
gate JSON, focus plan, surface status board, closeout draft, Linear update draft, and
approval board. Automation should read `latest-handoff.json` or archive `index.json` instead
of parsing Markdown or HTML; artifact audit compares those JSON artifacts' `activeBlocker`
identity against the gate and keeps the gate blocked if they drift.
When repeated MCP retries are rate-limited, run `npm run ntl:compare-entry-figma-unblock-plan`
and choose either MCP quota resolution or manual Figma UI build. For the manual route, run
`npm run ntl:compare-entry-manual-ui-slice-packet` and use the generated node names, sizes,
copy, and acceptance checks before touching the worksheet. Do not use the code-first override
unless the `Design+Code` completion criterion is explicitly changed.
If `generate_figma_design` is used as a fallback, record it with
`npm run ntl:compare-entry-figma-capture-reference`; raw capture nodes are visual references
only and do not satisfy the worksheet until their Figma names match the target frame/section.
Before checking the worksheet from a manual Figma UI rebuild, run
`npm run ntl:compare-entry-manual-node-evidence` with the observed frame/section node IDs and
confirm `readyForWorksheetCheck: true`, then run
`npm run ntl:compare-entry-apply-manual-node-evidence`. The apply command is guarded and
does not edit the worksheet unless the evidence is complete.
You can pass either raw node IDs or copied Figma node URLs. If both the frame and section names
were manually verified against the contract and the visual slice matches the preview, use
`COMPARE_ENTRY_MANUAL_NODE_CONTRACT_VERIFIED=true` as the short-form confirmation.
Copied URLs must belong to Figma file `Oj35jzmgbwnxzpTTqTcxLi`; mismatched file keys keep
`readyForWorksheetCheck` false even when `CONTRACT_VERIFIED` is provided.
Use `npm run ntl:compare-entry-manual-node-apply` with the same node evidence env values to
chain evidence generation, guarded worksheet apply, finalize, and ready-check.
For copied Figma URLs, the runner also accepts positional args:

```bash
npm run ntl:compare-entry-manual-node-apply -- \
  'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=10-17' \
  'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=10-18' \
  CONTRACT_VERIFIED
```

The `CONTRACT_VERIFIED` argument is intentionally explicit and should only be used after
checking the target names and visual match in Figma UI.
Run `npm run ntl:compare-entry-manual-node-apply-command` to regenerate a copy-ready
command template from the current recommended slice and evidence state.
Run `npm run ntl:compare-entry-manual-node-apply-command-ready` to verify that the apply
command, cockpit, gate, target metadata, and manual evidence state are synchronized before
using copied Figma URLs.
Run `npm run ntl:compare-entry-manual-unblock-cockpit` to regenerate a single HTML cockpit
that combines the preview, required checks, apply command, evidence state, and gate links.

After the manual URL apply succeeds, rerun:

```bash
npm run ntl:compare-entry-review-finalize
npm run ntl:compare-entry-review-ready-check
```

Only when the ready-check exits `0` should implementation move to `SUN-11` and `SUN-12`.
`SUN-11` should update the landing entry surfaces (`CompareEntryPage`, `LandingCompareSearch`,
`SearchBar` visual shell, brand/category route entry surfaces) while preserving query and
route behavior. `SUN-12` should update search-result compare hierarchy and shortlist visual
continuity while preserving grouping, favorite payload, shortlist persistence, and detail
modal entry behavior.
