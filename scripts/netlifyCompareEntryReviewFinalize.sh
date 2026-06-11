#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACT_DIR="${COMPARE_ENTRY_ARTIFACT_DIR:-$ROOT_DIR/output/playwright}"

cd "$ROOT_DIR"

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
node scripts/buildCompareEntryMobileBrandTopNavPreview.mjs
node scripts/buildCompareEntryManualUiSlicePacket.mjs
node scripts/buildCompareEntryFigmaCaptureReference.mjs
node scripts/buildCompareEntryManualNodeEvidence.mjs
node scripts/buildCompareEntryManualNodeApplyCommand.mjs
node scripts/buildCompareEntryManualUnblockCockpit.mjs
COMPARE_ENTRY_FIGMA_MCP_ATTEMPT_REUSE_LATEST=1 node scripts/buildCompareEntryFigmaMcpAttemptReport.mjs
node scripts/buildCompareEntryFigmaRetryPacket.mjs
node scripts/buildCompareEntryFigmaUnblockPlan.mjs
node scripts/buildCompareEntryReviewCloseoutDraft.mjs
node scripts/buildCompareEntryReviewGate.mjs
node scripts/buildCompareEntryManualNodeApplyCommand.mjs
node scripts/buildCompareEntryManualUnblockCockpit.mjs
node scripts/assertCompareEntryManualNodeApplyCommandReady.mjs
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
node scripts/buildCompareEntryMobileBrandTopNavPreview.mjs
node scripts/buildCompareEntryManualUiSlicePacket.mjs
node scripts/buildCompareEntryFigmaCaptureReference.mjs
node scripts/buildCompareEntryManualNodeEvidence.mjs
node scripts/buildCompareEntryManualNodeApplyCommand.mjs
node scripts/buildCompareEntryManualUnblockCockpit.mjs
COMPARE_ENTRY_FIGMA_MCP_ATTEMPT_REUSE_LATEST=1 node scripts/buildCompareEntryFigmaMcpAttemptReport.mjs
node scripts/buildCompareEntryFigmaRetryPacket.mjs
node scripts/buildCompareEntryFigmaUnblockPlan.mjs
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
node scripts/buildCompareEntryManualNodeApplyCommand.mjs
node scripts/buildCompareEntryManualUnblockCockpit.mjs
node scripts/assertCompareEntryManualNodeApplyCommandReady.mjs
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

printf '\nCompare entry review finalize complete:\n'
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-status-board.html"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-status.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-missing-detail.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-missing-detail.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-focus-plan.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-focus-plan.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-frame-progress-board.html"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-frame-progress-board.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-section-progress-board.html"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-section-progress-board.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-section-progress-board.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-surface-queue.html"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-surface-queue.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-surface-queue.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-surface-status-board.html"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-surface-status-board.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-surface-status-board.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-surface-packet.html"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-surface-packet.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-surface-packet.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-surface-section-packet.html"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-surface-section-packet.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-surface-section-packet.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-surface-checklist.html"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-surface-checklist.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-surface-checklist.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-section-action-card.html"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-section-action-card.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-section-action-card.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-mobile-brand-topnav-preview.html"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-mobile-brand-topnav-preview.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-manual-ui-slice-packet.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-manual-ui-slice-packet.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-figma-capture-reference.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-figma-capture-reference.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-manual-node-evidence.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-manual-node-evidence.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-manual-node-apply-command.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-manual-node-apply-command.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-manual-unblock-cockpit.html"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-manual-unblock-cockpit.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-manual-unblock-cockpit.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-manual-node-apply-command-readiness.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-manual-node-apply-command-readiness.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-figma-mcp-attempt.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-figma-mcp-attempt.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-figma-mcp-attempt-history.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-figma-mcp-attempt-history.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-figma-retry-packet.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-figma-retry-packet.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-figma-unblock-plan.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-figma-unblock-plan.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-frame-packet.html"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-frame-packet.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-frame-packet.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-section-packet.html"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-section-packet.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-next-section-packet.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-closeout-draft.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-closeout-draft.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-gate.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-gate.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-linear-update-draft.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-linear-update-draft.txt"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-linear-update-draft.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-approval-board.html"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-approval-board.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-delta.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-delta.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-artifact-audit.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-artifact-audit.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-evidence-summary.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-evidence-summary.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-sessions/index.html"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-sessions/index.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-sessions/latest-handoff.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-sessions/latest-handoff.html"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-sessions/latest-handoff.json"
