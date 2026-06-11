#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACT_DIR="${COMPARE_ENTRY_ARTIFACT_DIR:-$ROOT_DIR/output/playwright}"

cd "$ROOT_DIR"

print_gate_summary() {
  ARTIFACT_DIR="$ARTIFACT_DIR" node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const artifactDir = process.env.ARTIFACT_DIR;
const gatePath = path.join(artifactDir, 'compare-entry-review-gate.json');
const auditPath = path.join(artifactDir, 'compare-entry-review-artifact-audit.json');

try {
  const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'));
  let audit = null;
  try {
    audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  } catch {
    audit = null;
  }
  const blocker = gate.activeBlocker || {};
  const lines = [
    `gateState: ${gate.gateState || 'unknown'}`,
    `readyToUnblock: ${gate.readyToUnblock ? 'true' : 'false'}`,
    `artifactAuditState: ${audit?.auditState || gate.artifactAuditState || 'unknown'}`,
    `activeBlockerMismatchCount: ${audit?.activeBlockerMismatchCount ?? 'unknown'}`,
    `activeBlockerFilesChecked: ${audit?.activeBlockerFilesChecked ?? 'unknown'}`,
    `activeBlocker: ${blocker.kind || 'unknown'}`,
    `target: ${blocker.target || 'none'}`,
    `latestStatus: ${blocker.latestStatus || 'none'}`,
    `latestOperation: ${blocker.latestOperation || 'none'}`,
    `latestTool: ${blocker.latestTool || 'none'}`,
    `evidencePath: ${blocker.evidencePath || gatePath}`,
    `nextAction: ${blocker.nextAction || 'inspect compare-entry-review-gate.md'}`,
  ];
  process.stdout.write(lines.map((line) => `  - ${line}`).join('\n') + '\n');
} catch (error) {
  process.stdout.write(`  - gate summary unavailable: ${error instanceof Error ? error.message : String(error)}\n`);
}
NODE
}

bash scripts/netlifyCompareEntryReviewFinalize.sh
node scripts/buildCompareEntryReviewArtifactAudit.mjs
if ! node scripts/buildCompareEntryReviewGate.mjs --strict; then
  printf '\nCompare entry review ready check blocked:\n'
  print_gate_summary
  printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-artifact-audit.md"
  printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-artifact-audit.json"
  printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-gate.md"
  printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-gate.json"
  printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-approval-board.html"
  exit 1
fi

printf '\nCompare entry review ready check passed:\n'
print_gate_summary
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-artifact-audit.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-artifact-audit.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-gate.md"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-review-gate.json"
printf '  - %s\n' "$ARTIFACT_DIR/compare-entry-approval-board.html"
