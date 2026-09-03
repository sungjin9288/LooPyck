#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${SMOKE_BASE_URL:-https://loo-pyck.netlify.app}}"
DIAGNOSTICS_LIMIT="${SEARCH_DIAGNOSTICS_LIMIT:-120}"

TARGET_LABEL="$(node -e "
  const url = new URL(process.argv[1]);
  const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
  process.stdout.write(localHosts.has(url.hostname) ? 'local' : 'netlify');
" "$BASE_URL")"

OUTPUT_DIR="$(pwd)/output/playwright"
SNAPSHOT_PATH="${SEARCH_DIAGNOSTICS_OUTPUT:-${OUTPUT_DIR}/${TARGET_LABEL}-search-diagnostics-snapshot.json}"
REPORT_JSON_PATH="${SEARCH_QUALITY_REPORT_JSON:-${OUTPUT_DIR}/${TARGET_LABEL}-search-quality-observation-report.json}"
REPORT_MARKDOWN_PATH="${SEARCH_QUALITY_REPORT_MARKDOWN:-${OUTPUT_DIR}/${TARGET_LABEL}-search-quality-observation-report.md}"
ADMIN_SMOKE_SUMMARY="${TMPDIR:-/tmp}/loopyck-${TARGET_LABEL}-admin-smoke-summary.json"

mkdir -p "$OUTPUT_DIR"

SEARCH_DIAGNOSTICS_LIMIT="$DIAGNOSTICS_LIMIT" \
SEARCH_DIAGNOSTICS_OUTPUT="$SNAPSHOT_PATH" \
node scripts/netlifyAdminSmoke.mjs "$BASE_URL" > "$ADMIN_SMOKE_SUMMARY"

node \
  --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
  --experimental-strip-types \
  scripts/buildSearchQualityObservationReport.mjs \
  "$SNAPSHOT_PATH" \
  "$REPORT_JSON_PATH" \
  "$REPORT_MARKDOWN_PATH"
