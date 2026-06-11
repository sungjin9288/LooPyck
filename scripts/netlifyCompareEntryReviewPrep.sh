#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

bash scripts/netlifyCompareEntrySurfaceCapture.sh
node scripts/buildCompareEntryReviewPacket.mjs
node scripts/buildCompareEntryReviewWorksheet.mjs
node scripts/buildCompareEntryReviewDecisionLog.mjs
node scripts/buildCompareEntryReviewBoard.mjs
node scripts/buildCompareEntryManualFigmaPacket.mjs
node scripts/buildCompareEntryManualFrameSpecs.mjs
node scripts/buildCompareEntryManualBuildWorksheet.mjs
node scripts/buildCompareEntryReviewStatusBoard.mjs
node scripts/buildCompareEntryReviewMissingDetail.mjs
node scripts/buildCompareEntryReviewFrameProgressBoard.mjs
node scripts/buildCompareEntryReviewSurfaceQueue.mjs
node scripts/buildCompareEntryReviewSurfaceStatusBoard.mjs
node scripts/buildCompareEntryReviewNextSurfacePacket.mjs
node scripts/buildCompareEntryReviewNextFramePacket.mjs
node scripts/buildCompareEntryReviewNextSectionPacket.mjs
node scripts/buildCompareEntryReviewSectionProgressBoard.mjs
node scripts/buildCompareEntryReviewNextSurfaceSectionPacket.mjs
node scripts/buildCompareEntryReviewNextSurfaceChecklist.mjs
node scripts/buildCompareEntryReviewNextSectionActionCard.mjs
node scripts/buildCompareEntryReviewCloseoutDraft.mjs
node scripts/buildCompareEntryReviewGate.mjs
node scripts/buildCompareEntryReviewFocusPlan.mjs
node scripts/buildCompareEntryReviewFrameProgressBoard.mjs
node scripts/buildCompareEntryReviewSurfaceQueue.mjs
node scripts/buildCompareEntryReviewSurfaceStatusBoard.mjs
node scripts/buildCompareEntryReviewNextSurfacePacket.mjs
node scripts/buildCompareEntryReviewNextFramePacket.mjs
node scripts/buildCompareEntryReviewNextSectionPacket.mjs
node scripts/buildCompareEntryReviewSectionProgressBoard.mjs
node scripts/buildCompareEntryReviewNextSurfaceSectionPacket.mjs
node scripts/buildCompareEntryReviewNextSurfaceChecklist.mjs
node scripts/buildCompareEntryReviewNextSectionActionCard.mjs
node scripts/buildCompareEntryReviewStatusBoard.mjs
node scripts/buildCompareEntryReviewSurfaceStatusBoard.mjs
node scripts/buildCompareEntryLinearUpdateDraft.mjs
node scripts/buildCompareEntryApprovalBoard.mjs
node scripts/archiveCompareEntryReviewSession.mjs
node scripts/buildCompareEntryReviewDelta.mjs
node scripts/buildCompareEntryReviewArchiveIndex.mjs
node scripts/buildCompareEntryLatestHandoff.mjs
node scripts/buildCompareEntryReviewArtifactAudit.mjs
node scripts/buildCompareEntryReviewGate.mjs
node scripts/buildCompareEntryReviewFocusPlan.mjs
node scripts/buildCompareEntryReviewFrameProgressBoard.mjs
node scripts/buildCompareEntryReviewSurfaceQueue.mjs
node scripts/buildCompareEntryReviewSurfaceStatusBoard.mjs
node scripts/buildCompareEntryLinearUpdateDraft.mjs
node scripts/buildCompareEntryApprovalBoard.mjs
node scripts/archiveCompareEntryReviewSession.mjs
node scripts/buildCompareEntryReviewDelta.mjs
node scripts/buildCompareEntryReviewArchiveIndex.mjs
node scripts/buildCompareEntryLatestHandoff.mjs
node scripts/buildCompareEntryReviewEvidenceSummary.mjs

printf '\nCompare entry review packet ready:\n'
printf '  - %s\n' "$ROOT_DIR/output/playwright/netlify-compare-entry-surface-reference.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-design-review-packet.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-design-review-worksheet.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-design-review-decision-log.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-design-review-board.html"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-manual-figma-packet.html"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-manual-frame-specs.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-manual-build-worksheet.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-status-board.html"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-status.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-missing-detail.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-missing-detail.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-focus-plan.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-focus-plan.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-frame-progress-board.html"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-frame-progress-board.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-section-progress-board.html"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-section-progress-board.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-section-progress-board.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-surface-queue.html"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-surface-queue.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-surface-queue.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-surface-status-board.html"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-surface-status-board.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-surface-status-board.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-next-surface-packet.html"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-next-surface-packet.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-next-surface-packet.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-next-surface-section-packet.html"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-next-surface-section-packet.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-next-surface-section-packet.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-next-surface-checklist.html"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-next-surface-checklist.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-next-surface-checklist.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-next-frame-packet.html"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-next-frame-packet.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-next-frame-packet.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-next-section-packet.html"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-next-section-packet.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-next-section-packet.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-closeout-draft.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-closeout-draft.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-gate.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-gate.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-linear-update-draft.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-linear-update-draft.txt"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-linear-update-draft.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-approval-board.html"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-approval-board.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-delta.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-delta.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-artifact-audit.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-artifact-audit.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-evidence-summary.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-evidence-summary.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-sessions"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-sessions/index.html"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-sessions/index.json"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-sessions/latest-handoff.md"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-sessions/latest-handoff.html"
printf '  - %s\n' "$ROOT_DIR/output/playwright/compare-entry-review-sessions/latest-handoff.json"
