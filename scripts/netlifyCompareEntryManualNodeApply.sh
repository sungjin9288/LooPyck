#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACT_DIR="${COMPARE_ENTRY_ARTIFACT_DIR:-$ROOT_DIR/output/playwright}"

cd "$ROOT_DIR"

if [[ $# -gt 0 ]]; then
  if [[ $# -ne 3 ]]; then
    cat >&2 <<'USAGE'
Usage:
  npm run ntl:compare-entry-manual-node-apply -- FRAME_URL SECTION_URL CONTRACT_VERIFIED

The third argument must be CONTRACT_VERIFIED and means:
  - frame name exactly matches CompareEntry/Mobile/Brand-Musinsa
  - section name exactly matches TopNav/Context
  - visual slice matches the approved preview/manual UI packet
USAGE
    exit 1
  fi

  if [[ "$3" != "CONTRACT_VERIFIED" ]]; then
    echo "Manual node URL apply requires third argument CONTRACT_VERIFIED." >&2
    exit 1
  fi

  if [[ "$1" == "FRAME_FIGMA_URL" || "$2" == "SECTION_FIGMA_URL" ]]; then
    cat >&2 <<'USAGE'
Manual node URL apply received placeholder values.

Copy the actual Figma node URLs for:
  - Frame: CompareEntry/Mobile/Brand-Musinsa
  - Section: TopNav/Context

Expected URL shape:
  https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=10-17

Then rerun:
  npm run ntl:compare-entry-manual-node-apply -- 'FRAME_URL_FROM_FIGMA' 'SECTION_URL_FROM_FIGMA' CONTRACT_VERIFIED
USAGE
    exit 1
  fi

  if [[ "$1" != https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/*node-id=* && "$1" != https://www.figma.com/file/Oj35jzmgbwnxzpTTqTcxLi/*node-id=* ]]; then
    echo "Frame URL must be a copied Figma node URL from file Oj35jzmgbwnxzpTTqTcxLi and include node-id=." >&2
    exit 1
  fi

  if [[ "$2" != https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/*node-id=* && "$2" != https://www.figma.com/file/Oj35jzmgbwnxzpTTqTcxLi/*node-id=* ]]; then
    echo "Section URL must be a copied Figma node URL from file Oj35jzmgbwnxzpTTqTcxLi and include node-id=." >&2
    exit 1
  fi

  export COMPARE_ENTRY_MANUAL_NODE_FRAME_URL="$1"
  export COMPARE_ENTRY_MANUAL_NODE_SECTION_URL="$2"
  export COMPARE_ENTRY_MANUAL_NODE_CONTRACT_VERIFIED=true
  export COMPARE_ENTRY_MANUAL_NODE_SOURCE="${COMPARE_ENTRY_MANUAL_NODE_SOURCE:-manual-figma-copy-link}"
fi

COMPARE_ENTRY_ARTIFACT_DIR="$ARTIFACT_DIR" node scripts/buildCompareEntryManualNodeEvidence.mjs
COMPARE_ENTRY_ARTIFACT_DIR="$ARTIFACT_DIR" node scripts/applyCompareEntryManualNodeEvidence.mjs
COMPARE_ENTRY_ARTIFACT_DIR="$ARTIFACT_DIR" bash scripts/netlifyCompareEntryReviewFinalize.sh
COMPARE_ENTRY_ARTIFACT_DIR="$ARTIFACT_DIR" bash scripts/netlifyCompareEntryReviewReadyCheck.sh
